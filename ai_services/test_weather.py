from app.services.weather_service import extract_weather_features

latitude = 25.37
longitude = 91.73

response = extract_weather_features(latitude,longitude)
print(response)


