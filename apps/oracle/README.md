# Oracle App

The oracle app is used to:

- Take data from cronjobs (river water level, rainfall, Glofas, and GFH data)
- Update it in smart contract
- Save transaction hash in database

- Also create a source with oracle app which stores the blockchain id and transaction hash of the transaction in database

## Setup

```bash
pnpm install
```

## Run

```bash
# development
pnpm run start:dev

# production
pnpm run start:prod
```
