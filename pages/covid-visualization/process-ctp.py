
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
df = df.astype({"Confirmed": "int32", "Recovered": "int32", "People_Tested": "int32", "Deaths": "int32", "People_Hospitalized": "int32"})


print(df)
df.to_csv('ctp-data.csv', index=False)


