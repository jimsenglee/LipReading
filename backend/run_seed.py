#!/usr/bin/env python3
"""
Simple script to run the database seeding
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the seed
from seed import main

if __name__ == '__main__':
    print("🌱 Starting database seeding...")
    try:
        main()
        print("✅ Database seeding completed successfully!")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        sys.exit(1)



