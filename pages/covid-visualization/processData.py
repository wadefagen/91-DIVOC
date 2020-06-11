# coding=utf-8



import pandas as pd
import os

path = '../../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/'
path_data2 = '../../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports_us/'
jhu_base = '../../../../COVID-19/csse_covid_19_data/'
# if os.getenv("JHU_GIT"):
#   path = os.getenv("JHU_GIT")







stateTranslation = [
  ['Arizona', 'AZ'],
  ['Alabama', 'AL'],
  ['Alaska', 'AK'],
  ['Arkansas', 'AR'],
  ['California', 'CA'],
  ['Colorado', 'CO'],
  ['Connecticut', 'CT'],
  ['Delaware', 'DE'],
  ['Florida', 'FL'],
  ['Georgia', 'GA'],
  ['Hawaii', 'HI'],
  ['Idaho', 'ID'],
  ['Illinois', 'IL'],
  ['Indiana', 'IN'],
  ['Iowa', 'IA'],
  ['Kansas', 'KS'],
  ['Kentucky', 'KY'],
  ['Louisiana', 'LA'],
  ['Maine', 'ME'],
  ['Maryland', 'MD'],
  ['Massachusetts', 'MA'],
  ['Michigan', 'MI'],
  ['Minnesota', 'MN'],
  ['Mississippi', 'MS'],
  ['Missouri', 'MO'],
  ['Montana', 'MT'],
  ['Nebraska', 'NE'],
  ['Nevada', 'NV'],
  ['New Hampshire', 'NH'],
  ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'],
  ['New York', 'NY'],
  ['North Carolina', 'NC'],
  ['North Dakota', 'ND'],
  ['Ohio', 'OH'],
  ['Oklahoma', 'OK'],
  ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'],
  ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
  ['South Dakota', 'SD'],
  ['Tennessee', 'TN'],
  ['Texas', 'TX'],
  ['Utah', 'UT'],
  ['Vermont', 'VT'],
  ['Virginia', 'VA'],
  ['Washington', 'WA'],
  ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'],
  ['Wyoming', 'WY'],
]

stateDict = {}

for el in stateTranslation:
  stateDict[ el[1] ] = el[0]


def apply_us_active_cases(row):
  country = row['Country_Region']
  if country == "United States":
    row['Active'] = row['Confirmed'] - row['Recovered'] - row['Deaths']
  return row


def translateState(row):
  state = str(row["Province_State"]).strip()
  if ("," in state):
    if state == "Virgin Islands, U.S.":
      row["Province_State"] = "Virgin Islands"
    else:
      stateCode = state[-2:]
      if stateCode in stateDict:
        row["Province_State"] = stateDict[stateCode]

  return row

def processDate(date):
  print(date)
  df = pd.read_csv(path + date + ".csv")

  if 'Country/Region' in df:
    df = df.rename(columns={
      'Country/Region': 'Country_Region',
      'Province/State': 'Province_State'
    })

  df = df[ df['Province_State'].str.contains('Diamond Princess') != True ]
  df = df[ df['Country_Region'].str.contains('Diamond Princess') != True ]

  df = df.apply( translateState, axis=1 )


  stateData = df.groupby(['Country_Region', 'Province_State']).agg('sum').reset_index()
  stateData = stateData[ stateData["Country_Region"] == "US" ]

  countrydata = df.groupby(['Country_Region']).agg('sum').reset_index()
  countrydata['Province_State'] = ""

  df = stateData.append( countrydata )
  if 'Active' not in df:
    df['Active'] = df['Confirmed'] - df['Recovered'] - df['Deaths']
  df = df[ ["Country_Region", "Province_State", "Confirmed", "Recovered", "Active", "Deaths"] ] 
  df["Date"] = date

  # == Global ==
  worldCount = df.sum()
  worldCount['Country_Region'] = "Global"
  worldCount['Province_State'] = ""
  worldCount["Date"] = date
  df = df.append(worldCount, ignore_index = True)

  # == Europe ==
  who_europe = ["Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium", "Bosnia and Herzegovina",
                "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Czechia", "Denmark", "Estonia", "Finland", "France", "Georgia",
                "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Kazakhstan", "Kyrgyzstan",
                "Latvia", "Lithuania", "Luxembourg", "Malta", "Monaco", "Montenegro", "Netherlands", "North Macedonia",
                "Norway", "Poland", "Portugal", "Moldova", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia",
                "Spain", "Sweden", "Switzerland", "Tajikistan", "Turkey", "Turkmenistan", "Ukraine", "United Kingdom", "Uzbekistan"]

  europeCount = df[ df['Country_Region'].isin(who_europe) ].sum()
  europeCount['Country_Region'] = "Europe"
  europeCount['Province_State'] = ""
  europeCount["Date"] = date
  df = df.append(europeCount, ignore_index = True)

  return df

def processUSDailyReport(date):
  print("US - " + date)
  df = pd.read_csv(path_data2 + date + ".csv")

  df = df[ ["Province_State", "People_Tested", "People_Hospitalized"] ] 
  df["Date"] = date

  return df

# == Apply Index ==
def applyIndex(df):
  def createIndex(row):
    country = row["Country_Region"]
    state = row["Province_State"]
    date = row["Date"]
    if "Admin2" in row:
      admin2 = row["Admin2"]
    else:
      admin2 = pd.np.NaN

    keyValue = country + " @ " + date
    if not pd.isnull(admin2) and not pd.isnull(state):
      keyValue = admin2 + ", " + state + ", " + country + " @ " + date
    elif (state and not pd.isnull(state)):
      keyValue = state + ", " + country + " @ " + date

    return keyValue

  df['keyValue'] = df.apply(createIndex, axis=1)
  df = df.set_index('keyValue')
  return df  



# == JHU Daily Report ===
df = pd.DataFrame()
for filename in os.listdir(path):
   if not filename.endswith(".csv"): continue
   date = filename[0:10]

   #if date[0:2] != "06": continue

   df = df.append(processDate(date))


df2 = pd.DataFrame()
for filename in os.listdir(path_data2):
  if not filename.endswith(".csv"): continue
  date = filename[0:10]

  #if date[0:2] != "06": continue

  df2 = df2.append(processUSDailyReport(date))


# == Replace Data to Match Population ==
countryReplacement = {
  "US": "United States",
  "Korea, South": "South Korea",
  "Taiwan*": "Taiwan",
  "Bahamas, The": "Bahamas",
  "The Bahamas": "Bahamas",
  "Gambia, The": "Gambia",
  "The Gambia": "Gambia",
  "Cabo Verde": "Cape Verde",
  "Mainland China": "China",
  "Iran (Islamic Republic of)": "Iran",
  "Republic of Korea": "South Korea",
  "UK": "United Kingdom",
  "Vatican City": "Holy See",
  "Hong Kong SAR": "Hong Kong",
  "Macao SAR": "Macao",
  "Russian Federation": "Russia",
  "St. Martin": "Saint Martin",
  " Azerbaijan": "Azerbaijan",
  "Republic of Ireland": "Ireland",
  "Viet Nam": "Vietnam",
  "Congo (Brazzaville)": "Republic of the Congo",
  "Czech Republic": "Czechia",
  "Republic of Moldova": "Moldova",
}

stateReplacement = {
  "United States Virgin Islands": "Virgin Islands"
}

for key in countryReplacement:
  old = key
  new = countryReplacement[key]
  df["Country_Region"] = df["Country_Region"].replace(old, new)

for key in stateReplacement:
  old = key
  new = stateReplacement[key]
  df["Province_State"] = df["Province_State"].replace(old, new)


# == Apply Active Cases ==
df = df.astype({"Confirmed": "int32", "Recovered": "int32", "Active": "int32", "Deaths": "int32"})
df = df.apply(apply_us_active_cases, axis=1)

# == Add US Hospitalization Data ==
df = df.merge(df2, how='left', on=['Province_State', 'Date'])

# == Add index for further work ==
df = applyIndex(df)




# == Replace w/ Time Series Data ==
def processJHUTimeSeries(field, file):
  df = pd.read_csv(file)
  if 'Country/Region' in df:
    df = df.rename(columns={
      'Country/Region': 'Country_Region',
      'Province/State': 'Province_State'
    })

  data = []
  keys = []
  for index, row in df.iterrows():
    country = row["Country_Region"]
    state = row["Province_State"]
    if country == "US":
      country = "United States"

    if "Admin2" in row:
      admin2 = row["Admin2"]
    else:
      admin2 = pd.np.NaN

    #print(row.index)
    for cindex in row.index:
      if '20' in cindex:
        dateSplit = cindex.split("/")
        date = dateSplit[0].zfill(2) + "-" + dateSplit[1].zfill(2) + "-20" + dateSplit[2]

        keyValue = country + " @ " + date
        if not pd.isnull(admin2) and not pd.isnull(state):
          keyValue = admin2 + ", " + state + ", " + country + " @ " + date
        elif (state and not pd.isnull(state)):
          keyValue = state + ", " + country + " @ " + date

        data.append({
          'Country_Region': country,
          'Province_State': state,
          'Admin2': admin2,
          'Date': date,
          field: row[cindex]
        })
        keys.append(keyValue)

  df_result = pd.DataFrame(data, index=keys)
  return df_result

def chooseXY_Confirmed(row):
  col = 'Confirmed'
  x = row[col + "_x"]
  y = row[col + "_y"]

  if not pd.isnull(y):
    return y
  else:
    return x

def chooseXY_Deaths(row):
  col = 'Deaths'
  x = row[col + "_x"]
  y = row[col + "_y"]

  if not pd.isnull(y):
    return y
  else:
    return x

def chooseXY_Recovered(row):
  col = 'Recovered'
  x = row[col + "_x"]
  y = row[col + "_y"]

  if not pd.isnull(y):
    return y
  else:
    return x

print("Applying time-series...")

df_ts = processJHUTimeSeries('Confirmed', os.path.join(jhu_base, 'csse_covid_19_time_series', 'time_series_covid19_confirmed_global.csv') )
df_ts = df_ts[ ['Confirmed'] ]
df = df.merge(df_ts, how='left', left_index=True, right_index=True)
df['Confirmed'] = df.apply(chooseXY_Confirmed, axis=1)
df = df.drop(['Confirmed_x', 'Confirmed_y'], axis=1)

df_ts = processJHUTimeSeries('Confirmed', os.path.join(jhu_base, 'csse_covid_19_time_series', 'time_series_covid19_confirmed_US.csv') )
df_ts = df_ts[ ['Confirmed'] ]
df = df.merge(df_ts, how='left', left_index=True, right_index=True)
df['Confirmed'] = df.apply(chooseXY_Confirmed, axis=1)
df = df.drop(['Confirmed_x', 'Confirmed_y'], axis=1)

df_ts = processJHUTimeSeries('Deaths', os.path.join(jhu_base, 'csse_covid_19_time_series', 'time_series_covid19_deaths_global.csv') )
df_ts = df_ts[ ['Deaths'] ]
df = df.merge(df_ts, how='left', left_index=True, right_index=True)
df['Deaths'] = df.apply(chooseXY_Deaths, axis=1)
df = df.drop(['Deaths_x', 'Deaths_y'], axis=1)


df_ts = processJHUTimeSeries('Deaths', os.path.join(jhu_base, 'csse_covid_19_time_series', 'time_series_covid19_deaths_US.csv') )
df_ts = df_ts[ ['Deaths'] ]
df = df.merge(df_ts, how='left', left_index=True, right_index=True)
df['Deaths'] = df.apply(chooseXY_Deaths, axis=1)
df = df.drop(['Deaths_x', 'Deaths_y'], axis=1)

df_ts = processJHUTimeSeries('Recovered', os.path.join(jhu_base, 'csse_covid_19_time_series', 'time_series_covid19_recovered_global.csv') )
df_ts = df_ts[ ['Recovered'] ]
df = df.merge(df_ts, how='left', left_index=True, right_index=True)
df['Recovered'] = df.apply(chooseXY_Recovered, axis=1)
df = df.drop(['Recovered_x', 'Recovered_y'], axis=1)





#print(df)
df = df.astype({"Confirmed": "int32", "Recovered": "int32", "Active": "int32", "Deaths": "int32"})
df.to_csv('jhu-data.csv', index=False)
