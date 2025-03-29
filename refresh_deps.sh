#!/bin/bash
# This script removes all dependencies and reinstalls only the ones in requirements.txt

pip freeze > dep.txt && \
pip uninstall -y -r dep.txt && \
pip install -r requirements.txt && \
rm dep.txt
