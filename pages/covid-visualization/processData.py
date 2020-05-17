# coding=utf-8

import os

path = '../../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports/'
path_data2 = '../../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports_us/'
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


  #print(df['Province_State'].str.contains('Diamond Princess'))
  stateData = df.groupby(['Country_Region', 'Province_State']).agg('sum').reset_index()
  stateData = stateData[ stateData["Country_Region"] == "US" ]

  countrydata = df.groupby(['Country_Region']).agg('sum').reset_index()
  countrydata['Province_State'] = ""

  df = stateData.append( countrydata )
  if 'Active' not in df:
    df['Active'] = df['Confirmed'] - df['Recovered'] - df['Deaths']
  df = df[ ["Country_Region", "Province_State", "Confirmed", "Recovered", "Active", "Deaths"] ] 
  df["Date"] = date

  return df

def processUSDailyReport(date):
  print("US - " + date)
  df = pd.read_csv(path_data2 + date + ".csv")

  df = df[ ["Province_State", "People_Tested", "People_Hospitalized"] ] 
  df["Date"] = date

  return df



import pandas as pd
import os

df = pd.DataFrame()
for filename in os.listdir(path):
   if not filename.endswith(".csv"): continue
   date = filename[0:10]

   df = df.append(processDate(date))


df2 = pd.DataFrame()
for filename in os.listdir(path_data2):
  if not filename.endswith(".csv"): continue
  date = filename[0:10]

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


#print(df)
df.to_csv('jhu-data.csv', index=False)
