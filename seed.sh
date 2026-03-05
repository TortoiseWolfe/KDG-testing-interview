#!/bin/bash
# Seed 100 realistic customers into the API

API_URL="http://localhost:5000/api/customers"

FIRST_NAMES=("James" "Mary" "Robert" "Patricia" "John" "Jennifer" "Michael" "Linda" "David" "Elizabeth"
  "William" "Barbara" "Richard" "Susan" "Joseph" "Jessica" "Thomas" "Sarah" "Christopher" "Karen"
  "Charles" "Lisa" "Daniel" "Nancy" "Matthew" "Betty" "Anthony" "Margaret" "Mark" "Sandra"
  "Donald" "Ashley" "Steven" "Dorothy" "Andrew" "Kimberly" "Paul" "Emily" "Joshua" "Donna"
  "Kenneth" "Michelle" "Kevin" "Carol" "Brian" "Amanda" "George" "Melissa" "Timothy" "Deborah")

LAST_NAMES=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez"
  "Hernandez" "Lopez" "Gonzalez" "Wilson" "Anderson" "Thomas" "Taylor" "Moore" "Jackson" "Martin"
  "Lee" "Perez" "Thompson" "White" "Harris" "Sanchez" "Clark" "Ramirez" "Lewis" "Robinson"
  "Walker" "Young" "Allen" "King" "Wright" "Scott" "Torres" "Nguyen" "Hill" "Flores"
  "Green" "Adams" "Nelson" "Baker" "Hall" "Rivera" "Campbell" "Mitchell" "Carter" "Roberts")

DOMAINS=("gmail.com" "yahoo.com" "outlook.com" "company.com" "example.com")

echo "Seeding 100 customers..."

for i in $(seq 1 100); do
  first=${FIRST_NAMES[$((RANDOM % ${#FIRST_NAMES[@]}))]}
  last=${LAST_NAMES[$((RANDOM % ${#LAST_NAMES[@]}))]}
  domain=${DOMAINS[$((RANDOM % ${#DOMAINS[@]}))]}
  email=$(echo "${first}.${last}${i}@${domain}" | tr '[:upper:]' '[:lower:]')

  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${first} ${last}\",\"email\":\"${email}\"}")

  if [ "$response" = "201" ]; then
    printf "\r  %d/100 created" "$i"
  else
    printf "\r  %d/100 FAILED (HTTP %s)" "$i" "$response"
  fi
done

echo ""
echo "Done. Verify at $API_URL"
