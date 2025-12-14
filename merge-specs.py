#!/usr/bin/env python3
"""
Merge PrusaLink v1 API spec with legacy movement control endpoints.
"""

import yaml
import sys

def load_yaml(filepath):
    with open(filepath, 'r') as f:
        return yaml.safe_load(f)

def save_yaml(data, filepath):
    with open(filepath, 'w') as f:
        yaml.dump(data, f, default_flow_style=False, sort_keys=False, width=120)

def main():
    # Load specs
    v1_spec = load_yaml('/home/kkolk/prusatouch/spec/openapi.yaml')
    legacy_spec = load_yaml('/tmp/prusalink-legacy.yaml')

    # Add legacy movement endpoints to v1 spec
    legacy_endpoints = [
        '/api/printer/printhead',
        '/api/printer/tool',
        '/api/printer/bed',
    ]

    for endpoint in legacy_endpoints:
        if endpoint in legacy_spec['paths']:
            print(f"✓ Adding {endpoint}")
            v1_spec['paths'][endpoint] = legacy_spec['paths'][endpoint]
        else:
            print(f"✗ Endpoint {endpoint} not found in legacy spec")

    # Update info
    v1_spec['info']['title'] = 'PrusaTouch API (PrusaLink v1 + Legacy Movement)'
    v1_spec['info']['description'] = 'Merged API: PrusaLink v1 for jobs/files + Legacy API for movement controls'

    # Save merged spec
    save_yaml(v1_spec, '/home/kkolk/prusatouch/spec/openapi.yaml')

    print(f"\n✅ Merged spec saved with {len(v1_spec['paths'])} endpoints")
    print(f"   v1 endpoints: {len([p for p in v1_spec['paths'] if '/api/v1/' in p])}")
    print(f"   Legacy endpoints: {len([p for p in v1_spec['paths'] if '/api/printer/' in p])}")

if __name__ == '__main__':
    main()
