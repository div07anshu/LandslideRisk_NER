import requests

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather(latitude:float,longitude:float) ->dict :
    params ={
    "latitude" : latitude ,
    "longitude" : longitude,
    "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "wind_speed_10m"
        ),
    "hourly": (
            "precipitation,"
            "rain,"
            "relative_humidity_2m,"
            "soil_moisture_0_to_7cm"
        ),  
    "forecast_days": 2,
    "timezone": "auto",
    }

    response = requests.get(
        OPEN_METEO_URL,
        params=params,
        timeout=10,
    )

    response.raise_for_status()
    return response.json()

def extract_weather_features(latitude:float,longitude:float):
    weather = get_weather(latitude,longitude)
    hourly = weather["hourly"]

    precipitation = hourly["precipitation"]
    humidity = hourly["relative_humidity_2m"]
    soil_moisture = hourly["soil_moisture_0_to_7cm"]
    rainfall_24h = sum(precipitation[:24])
    rainfall_48h = sum(precipitation[:48])

    return {
        "rainfall_24h" : round(rainfall_24h,2),
        "rainfall_48h" : round(rainfall_48h,2),
        "max_hourly_rainfall" : round(max(precipitation),2),
        "average_humidity" : round(sum(humidity)/len(humidity),2),
        "soil_moisture" : soil_moisture[0],
    }

