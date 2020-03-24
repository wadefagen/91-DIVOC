
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
  "UK": "United Kingdom"  
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


# == Add Population ==


#print(df)
df.to_csv('jhu-data.csv')
