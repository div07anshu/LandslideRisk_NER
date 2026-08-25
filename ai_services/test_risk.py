from app.services.risk_service import calculate_risk

result = calculate_risk(
    rainfall_24h=120,
    rainfall_7d=340,
    soil_moisture=0.78,
    slope=35,
    elevation=1200,
    historical_landslides=6,
)

print(result)