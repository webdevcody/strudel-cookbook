# Overview

## Prereqs

You must have docker setup if you want to run the docker-compose.yml which spins up a postgres db locally.

## How to Run

1. `cp .env.example .env`
2. `npm i`
3. `npm run db:up`
4. `npm run db:migrate`
5. `npm run dev`

### Login with Google

You'll need to first setup a google project at console.cloud.google.com and read the better auth guide for how to setup the project keys and callback urls.
