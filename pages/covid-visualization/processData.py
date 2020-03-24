
path = '../../../../COVID-19/csse_covid_19_data\csse_covid_19_daily_reports/'


def processDate(date):
  print(date)
  df = pd.read_csv(path + date + ".csv")

  if 'Country/Region' in df:
    df = df.rename(columns={
      'Country/Region': 'Country_Region',
      'Province/State': 'Province_State'
    })

  df = df[ df['Province_State'].str.contains('Diamond Princess') != True ]

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



import pandas as pd
import os

df = pd.DataFrame()
for filename in os.listdir(path):
  if not filename.endswith(".csv"): continue
  date = filename[0:10]

  df = df.append(processDate(date))

#print(df)
df.to_csv('jhu-data.csv')
