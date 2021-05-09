#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ProjectStack } from '../lib/project-stack';

const app = new cdk.App();
new ProjectStack(app, 'ProjectStack');
