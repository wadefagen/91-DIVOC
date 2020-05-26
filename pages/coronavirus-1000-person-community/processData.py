# coding=utf-8

import os
import pandas as pd

path_jhu = '../../../../COVID-19/csse_covid_19_data/csse_covid_19_daily_reports_us/'
path_owid_csv = '../../../owid_covid-19-data/public/data/owid-covid-data.csv'
path_wikipedia_population_csv = '../../../wikipedia/wikipedia-population.csv'

def processDate(fileName):
  date = fileName[0:10]
  print(date)

  df = pd.read_csv(path_jhu + date + ".csv")

  df = df[ (df["Province_State"] != "Diamond Princess") & (df["Province_State"] != "Grand Princess") ]
  df = df[ ["Province_State", "Confirmed", "Deaths", "Recovered", "Active", "People_Tested"] ] 
  df = df.astype({
    "Confirmed": "int32",
    "Deaths": "int32",
    "Recovered": "float",
    "Active": "int32",
    "People_Tested": "float",
  })
  df["Date"] = date

  def calculate_na_values(row):
    if pd.isna(row["Recovered"]):
      row["Recovered"] = 0

    if pd.isna(row["Active"]):
      row["Active"] = row["Confirmed"] - row["Recovered"] - row["Deaths"]

    return row
  
  df = df.apply( calculate_na_values, axis=1 )
  df = df.astype({
    "Recovered": "int",
    "People_Tested": "int",
  })  

  sumValues = df.sum()
  df = df.append({
    "Province_State": "United States",
    "Confirmed": sumValues["Confirmed"],
    "Deaths": sumValues["Deaths"],
    "Recovered": sumValues["Recovered"],
    "Active": sumValues["Active"],
    "People_Tested": sumValues["People_Tested"],
    "Date": date
  }, ignore_index=True)
  return df


def delta_row_df(row, df, colName):
  matches = df[ ( df["Province_State"] == row["Province_State"] ) ]

  if len(matches) > 0:
    match = matches.iloc[0]
    for category in ["Confirmed", "Deaths", "Recovered", "Active", "People_Tested"]:
      row[colName + "_" + category] = row[category] - match[category]
    row[colName + "_Date"] = match["Date"]

  else:
    print("No match for " + row["Province_State"])

  return row


def delta_week(row):
  return delta_row_df(row, df_weekAgo, "dWeek")


def add_population(row):
  matches = df_population[ df_population["State"] == row["Province_State"] ]

  if len(matches) > 0:
    match = matches.iloc[0]
    row["Population"] = match["Population"]
  else:
    print("No population match for " + row["Province_State"])

  return row



df_population = pd.read_csv(path_wikipedia_population_csv, encoding="latin-1")

# JHU Data
files = os.listdir(path_jhu)
files.sort()

df_today = processDate( files[-2] )
df_weekAgo = processDate( files[-9] )

df_today = df_today.apply(delta_week, axis=1)
df_today = df_today.apply(add_population, axis=1)
df_today = df_today.astype({'Population': 'int32'})


print(df_today)
df_today.to_csv('data.csv', index=False)


# # OWID Data
# df = pd.read_csv(path_owid_csv)

# dates = df['date'].unique()
# dates.sort()
# today = dates[-1]
# weekAgo = dates[-8]

# df = df[ ["location", "date", "total_cases", "total_deaths", "total_tests", "tests_units", "population"] ]


# df_today = df[ df['date'] == today ]
# df_weekAgo = df[ df['date'] == weekAgo ]

# #print( len(df_today) )
# #print( len(df_weekAgo) )
# print(df_today)
# exit(1)


# df_today = processDate(files[-2])
# df_weekAgo = processDate(files[-9])

