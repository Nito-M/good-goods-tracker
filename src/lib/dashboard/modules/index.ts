/**
 * Side-effect module registry. Any future feature module (CRM, HR, AI Assistant,
 * Maintenance, Reporting, Accounting…) only has to add a file here that calls
 * `registerWidgets` — the dashboard system itself never changes.
 */
import './productivity';
import './inventory';
import './jobs';
import './sales';
import './finance';
import './business';
import './quickActions';
