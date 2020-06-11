#!/bin/bash

contract=$(cat config/contract.json | jq -r '.name')
# echo $contract
iwallet compile contract/$contract.js