import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './@service/interceptor.service';
import { getFirebaseApp, initFirebaseAnalytics, isFirebaseConfigured } from './@service/firebase/firebase.app';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      if (isFirebaseConfigured()) {
        getFirebaseApp();
        return initFirebaseAnalytics();
      }
      return Promise.resolve();
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({
        paramsInheritanceStrategy: 'always',
      }),
    ),
  ],
};
