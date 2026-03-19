import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        jobstores = {
            "default": SQLAlchemyJobStore(url=os.environ["DATABASE_URL"])
        }
        _scheduler = AsyncIOScheduler(jobstores=jobstores)
    return _scheduler


def start_scheduler():
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()


def schedule_send(workshop_id: str, run_date) -> str:
    from services.email_sender import send_workshop_emails
    scheduler = get_scheduler()
    job = scheduler.add_job(
        send_workshop_emails,
        trigger="date",
        run_date=run_date,
        args=[workshop_id],
        id=f"send_{workshop_id}",
        replace_existing=True,
    )
    return job.id


def cancel_send(workshop_id: str) -> None:
    scheduler = get_scheduler()
    try:
        scheduler.remove_job(f"send_{workshop_id}")
    except Exception:
        pass
