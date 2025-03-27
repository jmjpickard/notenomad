import { type CalendarService } from "./interface";
import { GoogleCalendarService } from "./google";

/**
 * Factory for creating calendar service instances based on provider
 */
export class CalendarServiceFactory {
  /**
   * Returns the appropriate calendar service instance for the given provider
   */
  static getService(provider: string): CalendarService {
    switch (provider.toLowerCase()) {
      case "google":
        return new GoogleCalendarService();
      // Future providers to be added here
      // case "microsoft":
      // case "outlook":
      //   return new MicrosoftCalendarService();
      // case "yahoo":
      //   return new YahooCalendarService();
      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }
  }
}
