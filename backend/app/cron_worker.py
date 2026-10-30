"""
Standalone Automation Cron Worker for Campus Resource Exchange — Phase 5.

Can be run periodically via Windows Task Scheduler, Linux crontab, or cloud scheduler:
    python -m app.cron_worker

Executes:
1. Upcoming pickup reminders (default 2h ahead)
2. Return deadline reminders (default 2h ahead)
3. Overdue transitions for unreturned collected assets
4. Expiry & cancellation of abandoned uncollected approved reservations (default 24h grace)
"""
import sys
import logging
from app.core.database import SessionLocal
from app.services.automation_service import run_all_automation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cron_worker")


def main():
    logger.info("Starting scheduled reservation automation cycle...")
    db = SessionLocal()
    try:
        results = run_all_automation(db)
        logger.info(
            f"Automation cycle finished successfully: "
            f"{results['pickup_reminders_sent']} pickup reminders, "
            f"{results['return_reminders_sent']} return reminders, "
            f"{results['overdue_marked']} overdue marked, "
            f"{results['expired_uncollected_cancelled']} uncollected expired."
        )
        return 0
    except Exception as exc:
        logger.error(f"Error during automation cycle: {exc}", exc_info=True)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
