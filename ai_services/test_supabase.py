from app.db.supabase import supabase
response = supabase.table("locations").select("*").execute()
print(response.data)