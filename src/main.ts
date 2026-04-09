/**
 * Main Application Entry Point
 * Bootstraps the Angular application with platform-specific configurations
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Bootstrap the application
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Application bootstrap error:', err));
