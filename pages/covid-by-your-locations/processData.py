# coding=utf-8

import os

path = '../../../../COVID-19/csse_covid_19_data\csse_covid_19_daily_reports/'
# if os.getenv("JHU_GIT"):
#   path = os.getenv("JHU_GIT")

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

  def createIndex(row):
    state = row["Province_State"]
    if "Admin2" in row:
      admin2 = row["Admin2"]
    else:
      admin2 = pd.np.NaN

    if pd.isnull(admin2):
      keyValue = state
    else:
      keyValue = admin2 + ", " + state

    return keyValue

  df["keyValue"] = df.apply(createIndex, axis=1)
  df = df.set_index('keyValue')
  return df



import pandas as pd
import os

files = os.listdir(path)

print("Reading Data...")
df_array = []
for i in range(-2, -(3 + 28), -1):
  df = processDate( files[i] )
  if i != -2:
    df = df[ ["Confirmed", "Deaths"] ]
  df_array.append(df)

  if i == -2:
    df_today = df
  elif i == -3:
    df_yesterday = df
  elif i == -9:
    df_weekAgo = df

    



def delta_row_df(row, df, colName):
  if row.name in df.index:
    match = df.loc[ row.name ]
    row[colName + "_Confirmed"] = row["Confirmed"] - match["Confirmed"]
    row[colName + "_Deaths"] = row["Deaths"] - match["Deaths"]

  return row


print("Processing - Part 1")

def delta_yesterday(row):
  return delta_row_df(row, df_yesterday, "dYesterday")

df_today = df_today.apply(delta_yesterday, axis=1)


def delta_week(row):
  return delta_row_df(row, df_weekAgo, "dWeek")

df_today = df_today.apply(delta_week, axis=1)




print("Processing - Part 2")

df_today["dayAgo_Confirmed"] = df_today["Confirmed"]
df_today["dayAgo_Deaths"] = df_today["Deaths"]
for i in range(1, len(df_array)):
  df1 = df_array[i]
  df_today = df_today.join( df1, how='left', rsuffix='_r' )

  df_today[f"d{str(i)}_Confirmed"] = df_today["dayAgo_Confirmed"] - df_today["Confirmed_r"]
  df_today[f"d{str(i)}_Deaths"] = df_today["dayAgo_Deaths"] - df_today["Deaths_r"]
  df_today[f"d{str(i)}_Confirmed"].fillna(0, inplace=True)
  df_today[f"d{str(i)}_Deaths"].fillna(0, inplace=True)
  df_today = df_today.astype({
    f"d{str(i)}_Confirmed": "int32",
    f"d{str(i)}_Deaths": "int32"
  })

  df_today["dayAgo_Confirmed"] = df_today["Confirmed_r"]
  df_today["dayAgo_Deaths"] = df_today["Deaths_r"]

  df_today = df_today.drop(columns=['Confirmed_r', 'Deaths_r'] )

df_today = df_today.drop(columns=['dayAgo_Confirmed', 'dayAgo_Deaths'] )


print("Processing - Part 3: Adding Cities")

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

def removeLastIndex(s):
  arr = s.split(" ")
  if arr[-1] == "County" or arr[-1] == "Borough" or arr[-1] == "Parish":
    arr = arr[:-1]
  elif arr[-1] == "Area" and arr[-2] == "Census":
    arr = arr[:-2]

  return " ".join(arr)


print("Processing - Part 4: Loading Population")

df_pop = pd.read_csv("county_population.csv")
df_pop = df_pop[ df_pop["population"] > 0 ]
df_pop["State"] = df_pop["State"].replace(stateDict)
#df_pop["County Name"] = df_pop["County Name"].str.split(" ").str.join("-") 
df_pop["County"] = df_pop["County Name"].apply(removeLastIndex)
df_pop["keyValue"] = df_pop["County"] + ", " + df_pop["State"]
df_pop.set_index("keyValue", inplace=True)

print(df_pop)

print("Processing - Part 5: Adding Population")

for keyName in df_today.index:
  if keyName in df_pop.index:
    df_today.loc[keyName, "Population"] = df_pop.loc[keyName, "population"]
    continue

  keyPieces = keyName.split(",")
  if len(keyPieces) >= 2:
    k = keyPieces[0] + " city" + "," + keyPieces[1]
    if k in df_pop.index:
      df_today.loc[keyName, "Population"] = df_pop.loc[k, "population"]
      continue

    k = keyPieces[0] + " City" + "," + keyPieces[1]
    if k in df_pop.index:
      df_today.loc[keyName, "Population"] = df_pop.loc[k, "population"]
      continue
  
  print("Missing: " + keyName)




print(df_today)
# df_today.to_csv('jhu-county-data.csv', index=False)
