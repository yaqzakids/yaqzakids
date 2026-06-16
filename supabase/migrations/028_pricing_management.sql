INSERT INTO platform_settings (key, value) VALUES
('subscription_plans', '{
  "free": {"name": "Free", "price": 0, "period": "forever", "description": "Get started with essential learning content.", "features": ["5 articles per month", "All 3 languages"], "is_active": true, "stripe_price_id": ""},
  "family_monthly": {"name": "Family Monthly", "price": 9.99, "period": "month", "description": "Full access for your whole family, billed monthly.", "features": ["Unlimited articles", "All 3 languages", "Parent dashboard", "Up to 3 children"], "is_active": true, "stripe_price_id": ""},
  "family_yearly": {"name": "Family Yearly", "price": 79.99, "period": "year", "description": "Best value for families committed to learning all year.", "features": ["Save 33%", "All features included"], "is_active": true, "stripe_price_id": ""},
  "school": {"name": "School", "price": 299, "period": "year", "description": "For classrooms and homeschool groups.", "features": ["Up to 30 students", "Teacher dashboard", "All features"], "is_active": true, "stripe_price_id": ""}
}')
ON CONFLICT (key) DO NOTHING;
