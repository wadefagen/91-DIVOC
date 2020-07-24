

baseDir = "../sync/owid/public/data/"

import os
import pandas as pd


## == Testing Data ==
df_testing = pd.read_csv(os.path.join(baseDir, "testing/covid-testing-all-observations.csv"))
df_testing = df_testing[ df_testing["Entity"] != "United States - tests performed (CDC) (incl. non-PCR)" ]

df_entity = df_testing["Entity"].str.split(" - ", n=1, expand=True)

df_testing["Country_Region"] = df_entity[0]
df_testing["Tested_Units"] = df_entity[1]
df_testing = df_testing.rename(columns={"Cumulative total": "People_Tested"})

df_testing = df_testing[ ["Date", "Country_Region", "People_Tested", "Tested_Units"] ]

df_testing = df_testing.groupby( ["Date", "Country_Region"] ).agg("max").reset_index()

df_testing_global = df_testing.groupby( ["Date"] ).agg("sum").reset_index()
df_testing_global["Country_Region"] = "Global"
df_testing_global["Tests Unit"] = "varies"
df_testing = df_testing.append(df_testing_global, ignore_index = True, sort = False)

df_testing["keyValue"] = df_testing["Country_Region"] + " @ " + df_testing["Date"]
df_testing.set_index("keyValue", inplace=True)


## == Case Data ==
df_data = pd.read_csv(os.path.join(baseDir, "owid-covid-data.csv"))
df_data = df_data[ df_data["location"] != "International" ]
df_data = df_data[ ["date", "location", "total_cases", "total_deaths"] ]

df_data = df_data.rename(columns={
  'date': 'Date',
  'location': 'Country_Region',
  'total_cases': 'Confirmed',
  'total_deaths': 'Deaths'
})

df_data["Country_Region"] = df_data["Country_Region"].replace("World", "Global")

df_data["keyValue"] = df_data["Country_Region"] + " @ " + df_data["Date"]
df_data.set_index("keyValue", inplace=True)


## == Merged ==
#df_testing = df_testing[ ["People_Tested", "Tested_Units"] ]
df_merged = df_data.join(df_testing, rsuffix = "_r")
df_merged.drop(['Date_r', 'Country_Region_r'], axis=1, inplace=True)



# == Testing Data Roll Back ==

def rollBackDate(date, amount=1):
  from datetime import datetime, timedelta

  dateObj = datetime.strptime(date, "%Y-%m-%d")
  dateObj = dateObj - timedelta(days=amount)
  return dateObj.strftime("%Y-%m-%d")


def applyTestingCountForward(row):
  val = row["People_Tested"]
  date = row["Date"]
  dDays = 1

  while pd.isnull(val):
    oldDate = rollBackDate(date, dDays)
    key = row["Country_Region"] + " @ " + oldDate
    if key in df_merged_testingData.index: 
      df_old = df_merged_testingData.loc[key]
    else:
      break
    val = df_old["People_Tested"]
    dDays = dDays + 1

  if row["People_Tested"] != val and not pd.isnull(val): # and row["Country_Region"] == "Sweden":
    row["People_Tested"] = val
    row["Tested_Units"] = df_old["Tested_Units"]
    print("Updated " + row["Country_Region"] + " on " + row["Date"] + " w/ " + str(val))
  return row

countries_with_testing_data = df_testing["Country_Region"].unique() 

df_merged_testingData = df_merged[ df_merged["Country_Region"].isin(countries_with_testing_data) ]
df_merged_other = df_merged[ ~df_merged.isin(df_merged_testingData) ]


df_merged_testingData = df_merged_testingData.apply(applyTestingCountForward, axis=1)

df_merged = pd.concat([df_merged_testingData, df_merged_other])
df_merged = df_merged.dropna(how='all')


# # Write
df_merged.sort_values('Date', inplace=True)
print(df_merged)
df_merged.to_csv('owid.csv', index=False, float_format='%.0f')
