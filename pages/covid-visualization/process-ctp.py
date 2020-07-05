
fetch = True
file_location = '../../sync/ctp-latest.csv'

if fetch:
  import urllib.request

  url = 'https://covidtracking.com/api/v1/states/daily.csv'
  urllib.request.urlretrieve(url, '../../sync/ctp-latest.csv')


# == Data Processing ==

import pandas as pd


stateTranslation = [
  ['Arizona', 'AZ'], ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arkansas', 'AR'], ['California', 'CA'],
  ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'], ['Florida', 'FL'], ['Georgia', 'GA'],
  ['Hawaii', 'HI'], ['Idaho', 'ID'], ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'],
  ['Kansas', 'KS'], ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'], ['Maryland', 'MD'],
  ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'], ['Mississippi', 'MS'], ['Missouri', 'MO'],
  ['Montana', 'MT'], ['Nebraska', 'NE'], ['Nevada', 'NV'], ['New Hampshire', 'NH'], ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'], ['New York', 'NY'], ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'],
  ['Oklahoma', 'OK'], ['Oregon', 'OR'], ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'],
  ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'], ['Utah', 'UT'], ['Vermont', 'VT'],
  ['Virginia', 'VA'], ['Washington', 'WA'], ['West Virginia', 'WV'], ['Wisconsin', 'WI'], ['Wyoming', 'WY'],
  ['American Samoa', 'AS'], ['Guam', 'GU'], ['Northern Mariana Islands', 'MP'], ['Puerto Rico', 'PR'], ['Virgin Islands', 'VI'],
  ['District of Columbia', 'DC']
]

stateDict = {}
for el in stateTranslation:
  stateDict[ el[1] ] = el[0]


def format_rows_to_JHU(row):
  d = str(row['Date'])
  year = d[0:4]
  month = d[4:6]
  day = d[6:8]
  row['Date'] = month + "-" + day + "-" + year

  row["Province_State"] = stateDict[ row["Province_State"] ]

  if pd.isnull(row["Recovered"]): row["Recovered"] = 0
  if pd.isnull(row["Deaths"]): row["Deaths"] = 0
  if pd.isnull(row["People_Hospitalized"]): row["People_Hospitalized"] = 0
  if pd.isnull(row["Confirmed"]): row["Confirmed"] = 0
  if pd.isnull(row["People_Tested"]): row["People_Tested"] = 0
    
  return row




df = pd.read_csv(file_location)
df = df.sort_values('date')
df = df[ ['date', 'state', 'recovered', 'death', 'hospitalized', 'positive', 'totalTestResults'] ]
# Rename columns to JHU-values
df = df.rename(columns={
  'date': 'Date',
  'state': 'Province_State',
  'recovered': 'Recovered',
  'totalTestResults': 'People_Tested',
  'death': 'Deaths',
  'hospitalized': 'People_Hospitalized',
  'positive': 'Confirmed',
})


df = df.apply(format_rows_to_JHU, axis=1)


df_allByDate = df.groupby(["Date"]).agg("sum").reset_index()
df_allByDate["Province_State"] = "United States"
df = pd.concat([df, df_allByDate])


northeast = ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"];
midwest = ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"];
south = ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia", "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"];        
west = ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"];

df_agg = df[ df["Province_State"].isin(northeast) ].groupby(["Date"]).agg("sum").reset_index()
df_agg["Province_State"] = "US-Northeast"
df = pd.concat([df, df_agg], sort=False)

df_agg = df[ df["Province_State"].isin(midwest) ].groupby(["Date"]).agg("sum").reset_index()
df_agg["Province_State"] = "US-Midwest"
df = pd.concat([df, df_agg], sort=False)

df_agg = df[ df["Province_State"].isin(south) ].groupby(["Date"]).agg("sum").reset_index()
df_agg["Province_State"] = "US-South"
df = pd.concat([df, df_agg], sort=False)

df_agg = df[ df["Province_State"].isin(west) ].groupby(["Date"]).agg("sum").reset_index()
df_agg["Province_State"] = "US-West"
df = pd.concat([df, df_agg], sort=False)



df = df.astype({"Confirmed": "int32", "Recovered": "int32", "People_Tested": "int32", "Deaths": "int32", "People_Hospitalized": "int32"})


print(df)
df.to_csv('ctp-data.csv', index=False)


