# coding=utf-8

import os

path = '../../../../COVID-19/csse_covid_19_data\csse_covid_19_daily_reports/'
# if os.getenv("JHU_GIT"):
#   path = os.getenv("JHU_GIT")

cityTransform = {
  "Cook, Illinois": "Chicago",
  "Harris, Texas": "Houston",
  "Maricopa, Arizona": "Phoenix",
  "Orange, California": "Santa Ana",
  "Kings, New York": "Brooklyn, NYC",
  "Queens, New York": "Queens, NYC",
  "King, Washington": "Seattle",
  "Clark, Nevada": "Las Vegas",
  "Tarrant, Texas": "Fort Worth",
  "Bexar, Texas": "San Antonio",
  "Broward, Florida": "Fort Lauderdale",
  "Santa Clara, California": "San Jose",
  "Wayne, Michigan": "Detroit",
  "Alameda, California": "Oakland",
  "New York, New York": "Manhattan, NYC",
  "Middlesex, Massachusetts": "Lowell and Cambridge",
  "Suffolk, New York": "Riverhead",
  "Hillsborough, Florida": "Tampa",
  "Bronx, New York": "Bronx, NYC",
  "Nassau, New York": "Mineola",
  "Orange, Florida": "Orlando",
  "Franklin, Ohio": "Columbus",
  "Hennepin, Minnesota": "Minneapolis",
  "Oakland, Michigan": "Pontiac",
  "Travis, Texas": "Austin",
  "Cuyahoga, Ohio": "Cleveland",
  "Allegheny, Pennsylvania": "Pittsburgh",
  "Contra Costa, California": "Martinez",
  "Mecklenburg, North Carolina": "Charlotte",
  "Wake, North Carolina": "Raleigh",
  "Montgomery, Maryland": "Rockville",
  "Fulton, Georgia": "Atlanta",
  "Pima, Arizona": "Tucson",
  "Collin, Texas": "McKinney",
  "St. Louis, Missouri": "Clayton",
  "Pinellas, Florida": "Clearwater",
  "Westchester, New York": "White Plains",
  "Marion, Indiana": "Indianapolis",
  "Duval, Florida": "Jacksonville",
  "Fairfield, Connecticut": "Bridgeport",
  "Bergen, New Jersey": "Hackensack",
  "Shelby, Tennessee": "Memphis",
  "DuPage, Illinois": "Wheaton",
  "Gwinnett, Georgia": "Lawrenceville",
  "Erie, New York": "Buffalo",
  "Prince George's, Maryland": "Upper Marlboro",
  "Kern, California": "Bakersfield",
  "Pierce, Washington": "Tacoma",
  "Macomb, Michigan": "Mount Clemens",
  "Hidalgo, Texas": "Edinburg",
  "Middlesex, New Jersey": "New Brunswick",
  "Montgomery, Pennsylvania": "Norristown",
  "Baltimore, Maryland": "Towson",
  "Hamilton, Ohio": "Cincinnati",
  "Snohomish, Washington": "Everett",
  "Multnomah, Oregon": "Portland",
  "Suffolk, Massachusetts": "Boston",
  "Essex, New Jersey": "Newark",
  "Oklahoma, Oklahoma": "Oklahoma City",
  "Essex, Massachusetts": "Salem and Lawrence",
  "Fort Bend, Texas": "Richmond",
  "Jefferson, Kentucky": "Louisville",
  "San Mateo, California": "Redwood City",
  "Cobb, Georgia": "Marietta",
  "DeKalb, Georgia": "Decatur",
  "Lee, Florida": "Fort Myers",
  "San Joaquin, California": "Stockton",
  "Monroe, New York": "Rochester",
  "El Paso, Colorado": "Colorado Springs",
  "Polk, Florida": "Bartow",
  "Norfolk, Massachusetts": "Dedham",
  "Lake, Illinois": "Waukegan",
  "Jackson, Missouri": "Kansas City",
  "Davidson, Tennessee": "Nashville",
  "Will, Illinois": "Joliet",
  "Bernalillo, New Mexico": "Albuquerque",
  "Hudson, New Jersey": "Jersey City",
  "Champaign, Illinois": "Champaign-Urbana"
}


def processDate(fileName):
  date = fileName[0:10]
  print(date)

  df = pd.read_csv(path + date + ".csv")

  if 'Country/Region' in df:
    df = df.rename(columns={
      'Country/Region': 'Country_Region',
      'Province/State': 'Province_State'
    })

  df = df[ df["Country_Region"] == "US" ]

  df = df[ ["Admin2", "Province_State", "Confirmed", "Deaths"] ] 
  df = df.astype({"Confirmed": "int32", "Deaths": "int32"})
  df["Date"] = date

  return df



import pandas as pd
import os

files = os.listdir(path)

df_today = processDate(files[-2])
df_yesterday = processDate(files[-3])
df_weekAgo = processDate(files[-9])



def delta_row_df(row, df, colName):
  if pd.isna(row["Admin2"]):
    matches = df[ ( df["Province_State"] == row["Province_State"] ) ]
  else:
    matches = df[ ( df["Admin2"] == row["Admin2"] ) & ( df["Province_State"] == row["Province_State"] ) ]

  if len(matches) == 0:
    a = 1
    # row[colName + "_confirmed"] = pd.np.nan
    # row[colName + "_deaths"] = pd.np.nan
  else:
    match = matches.iloc[0]
    row[colName + "_Confirmed"] = row["Confirmed"] - match["Confirmed"]
    row[colName + "_Deaths"] = row["Deaths"] - match["Deaths"]

  return row

def delta_yesterday(row):
  return delta_row_df(row, df_yesterday, "dYesterday")

df_today = df_today.apply(delta_yesterday, axis=1)


def delta_week(row):
  return delta_row_df(row, df_weekAgo, "dWeek")

df_today = df_today.apply(delta_week, axis=1)


def add_city(row):
  if pd.isna(row["Admin2"]):
    return row

  key = row["Admin2"] + ", " + row["Province_State"]
  if key in cityTransform:
    row["City"] = cityTransform[key]
  else:
    row["City"] = ""
  return row

df_today = df_today.apply(add_city, axis=1)


print(df_today)
df_today.to_csv('jhu-county-data.csv', index=False)
