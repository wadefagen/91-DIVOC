import pandas as pd

df_jhu = pd.read_csv('jhu.csv')
df_jhu = df_jhu.astype( {"Province_State": "str"} )
df_jhu["Province_State"] = df_jhu["Province_State"].replace( {"nan": ""} )
df_jhu["keyValue"] = df_jhu["Country_Region"] + df_jhu["Province_State"] + " @ " + df_jhu["Date"]
df_jhu.set_index("keyValue", inplace=True)


df_jhu_US = df_jhu[ (df_jhu["Country_Region"] == "United States") & (df_jhu["Province_State"] == "") ]

#df_jhu_states = df_jhu[ (df_jhu["Country_Region"] == "United States") & (df_jhu["Province_State"] != "") ]

#df_jhu = df_jhu[ ~df_jhu["Province_State"].isnull() ]
df_jhu = df_jhu[ (df_jhu["Province_State"] != "") ]
df_jhu.sort_values('Date', inplace=True)

jhu_date = df_jhu.tail(1)["Date"].values[0]

print( jhu_date )

df_owid = pd.read_csv('owid.csv')
df_owid = df_owid[ df_owid["Date"] <= jhu_date ]
df_owid["keyValue"] = df_owid["Country_Region"] + " @ " + df_owid["Date"]
df_owid.set_index("keyValue", inplace=True)


#df_jhu_states = df_jhu_states[ df_jhu_states["Province_State"] != "" ] 
df = pd.concat( [df_jhu, df_owid], sort=False )



for index in df_jhu_US.index:
  #print(index)
  df.loc[index, "Confirmed"] = df_jhu_US.loc[index]["Confirmed"]
  df.loc[index, "Deaths"] = df_jhu_US.loc[index]["Deaths"]
  df.loc[index, "Recovered"] = df_jhu_US.loc[index]["Recovered"]
  df.loc[index, "Active"] = df_jhu_US.loc[index]["Active"]



#print(df_jhu_US)
df.sort_values('Date', inplace=True)


#print( df[ df["Country_Region"] == "United States" ] )


df.to_csv('merged.csv', index=False, float_format='%.0f')
