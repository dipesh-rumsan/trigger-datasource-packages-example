# Trigger Flow

## 1. Source Creation

- Source is created in contract in oracle contract via `createSource()`
- Source ID is generated
- Source ID is saved in database
- Trigger app uses the same database for source information

## 2. Data Fetching and Updates

- Oracle app runs cronjobs to fetch data:
  - River Water Level (every 15 minutes)
  - Rainfall (every 15 minutes)
  - Glofas (every hour)
  - GFH (every 24 hours)
- Data is updated in smart contract via `updateSourceValue()`

## 3. Trigger Creation

- Trigger is created from trigger app
- Each trigger contains:
  - Sources
  - Threshold value (defined in `triggerStatement` with source, operator, and value)
- Phase can have multiple triggers, each with different sources and thresholds
- Trigger is saved in database

## 4. Threshold Verification

- Scheduled job runs periodically
- Latest source value is fetched from database
- Source value is compared against threshold using the specified operator
- If condition is met:
  - Trigger is set to `triggered` (`isTriggered = true`)
- If condition is not met:
  - Monitoring continues
