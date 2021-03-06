# coding=utf-8



import pandas as pd
import os

path = '../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/'
path_data2 = '../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports_us/'
jhu_base = '../../../COVID-19/csse_covid_19_data/'
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

#print(stateDict)

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
  df = pd.read_csv(path + date + ".csv")

  # Re-arrange date to YYYY-MM-DD format:
  datePieces = date.split("-")
  date = datePieces[2] + "-" + datePieces[0] + "-" + datePieces[1]
  print(date)

  if 'Country/Region' in df:
    df = df.rename(columns={
      'Country/Region': 'Country_Region',
      'Province/State': 'Province_State'
    })

  #df = df[ df['Province_State'].str.contains('Diamond Princess') != True ]
  #df = df[ df['Country_Region'].str.contains('Diamond Princess') != True ]

  #df.replace(stateDict, inplace=True)
  df = df.apply( translateState, axis=1 )


  stateData = df.groupby(['Country_Region', 'Province_State']).agg('sum').reset_index()
  stateData = stateData[ stateData["Country_Region"] == "US" ]

  countrydata = df.groupby(['Country_Region']).agg('sum').reset_index()
  countrydata['Province_State'] = ""

  df = stateData.append( countrydata, sort=False )
  if 'Active' not in df:
    df['Active'] = df['Confirmed'] - df['Recovered'] - df['Deaths']
  df = df[ ["Country_Region", "Province_State", "Confirmed", "Recovered", "Active", "Deaths"] ] 
  df["Date"] = date

  # == Global ==
  worldCount = df[ df["Province_State"] == "" ].sum()
  worldCount['Country_Region'] = "Global"
  worldCount['Province_State'] = ""
  worldCount["Date"] = date
  df = df.append(worldCount, ignore_index = True)

  return df

def processUSDailyReport(date):
  df = pd.read_csv(path_data2 + date + ".csv")

  # Re-arrange date to YYYY-MM-DD format:
  datePieces = date.split("-")
  date = datePieces[2] + "-" + datePieces[0] + "-" + datePieces[1]
  print("US - " + date)

  df = df[ ["Province_State", "People_Tested", "People_Hospitalized"] ] 
  df["Date"] = date

  return df

# == Apply Index ==
def applyIndex(df):
  def createIndex(row):
    country = row["Country_Region"]
    date = row["Date"]

    state = pd.np.NaN
    if "Province_State" in row:
      state = row["Province_State"]

    admin2 = pd.np.NaN
    if "Admin2" in row:
      admin2 = row["Admin2"]

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

   #if date[0:2] != "07": continue

   df = df.append(processDate(date))


df2 = pd.DataFrame()
for filename in os.listdir(path_data2):
  if not filename.endswith(".csv"): continue
  date = filename[0:10]

  #if date[0:2] != "07": continue

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

        # Re-arrange date to YYYY-MM-DD format:
        datePieces = date.split("-")
        date = datePieces[2] + "-" + datePieces[0] + "-" + datePieces[1]

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



# == Create US-wide data ==
print("Adding US-wide state data...")
df_USglobal = df[ (df["Country_Region"] == "United States") & (df["Province_State"] == "") ]

df_allByDate = df[ (df["Province_State"] != "") & (df["Country_Region"] == "United States") ].groupby(["Date"]).agg("sum").reset_index()
df_allByDate["Country_Region"] = "United States"
df_allByDate = applyIndex(df_allByDate)

# Apply better global confirmed/deaths data:
df_allByDate = df_allByDate.join(df_USglobal, rsuffix='_r')
df_allByDate["Confirmed"] = df_allByDate["Confirmed_r"]
df_allByDate["Deaths"] = df_allByDate["Deaths_r"]
df_allByDate = df_allByDate.drop(['People_Tested_r', 'People_Hospitalized_r', 'Confirmed_r', 'Deaths_r', 'Recovered_r', 'Active_r', 'Date_r', 'Country_Region_r'], axis=1)
df_allByDate["Province_State"] = "United States"

df = pd.concat([df, df_allByDate], sort=False)








# df_allByDate = df[ (df["Province_State"] != "") & (df["Country_Region"] == "United States") & \
#                    (df["Province_State"] != "New York") & (df["Province_State"] != "United States") & \
#                    (df["Province_State"] != "New Jersey") & (df["Province_State"] != "Connecticut") ].groupby(["Date"]).agg("sum").reset_index()
# df_allByDate["Province_State"] = "US-exclude-NY/NJ/CT"
# df_allByDate["Country_Region"] = "United States"
# df = pd.concat([df, df_allByDate], sort=False)

# northeast = ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"]
# midwest = ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"]
# south = ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia", "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"]
# west = ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"]

# df_agg = df[ df["Province_State"].isin(northeast) ].groupby(["Date"]).agg("sum").reset_index()
# df_agg["Province_State"] = "US-Northeast"
# df_agg["Country_Region"] = "United States"
# df = pd.concat([df, df_agg], sort=False)

# df_agg = df[ df["Province_State"].isin(midwest) ].groupby(["Date"]).agg("sum").reset_index()
# df_agg["Province_State"] = "US-Midwest"
# df_agg["Country_Region"] = "United States"
# df = pd.concat([df, df_agg], sort=False)

# df_agg = df[ df["Province_State"].isin(south) ].groupby(["Date"]).agg("sum").reset_index()
# df_agg["Province_State"] = "US-South"
# df_agg["Country_Region"] = "United States"
# df = pd.concat([df, df_agg], sort=False)

# df_agg = df[ df["Province_State"].isin(west) ].groupby(["Date"]).agg("sum").reset_index()
# df_agg["Province_State"] = "US-West"
# df_agg["Country_Region"] = "United States"
# df = pd.concat([df, df_agg], sort=False)


df = df.drop(['People_Hospitalized'], axis=1)
df = df.astype({"Confirmed": "int32", "Recovered": "int32", "Active": "int32", "Deaths": "int32"})
#print(df)
df.to_csv('jhu.csv', index=False, float_format='%.0f')
