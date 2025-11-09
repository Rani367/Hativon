#!/bin/bash
# Development server startup script with environment variables

export POSTGRES_URL='postgres://localhost:5432/school_newspaper'
export POSTGRES_URL_NON_POOLING='postgres://localhost:5432/school_newspaper'

pnpm run dev
