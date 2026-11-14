-- One-time backfill: the home-tab tutorial should only ever show to someone
-- going through onboarding for the first time after this feature shipped —
-- not to every existing account that already finished onboarding before it
-- existed. Marks those as already "seen" so only genuinely new signups
-- (still mid-onboarding, or who sign up after this runs) get the tour.
update public.profiles
set tutorial_completed = true
where onboarding_completed = true;
