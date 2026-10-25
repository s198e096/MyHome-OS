-- One-time backfill: fill in a sensible default expected_life_years for
-- systems that were added before this default existed. Only touches rows
-- where the value is still unset, so anything the user already entered is
-- left alone. Mirrors defaultExpectedLifeYears() in mobile/src/lib/constants.js.
update public.systems
set expected_life_years = case
  when category = 'appliance' then
    case
      when brand ~* 'range hood' then 14
      when brand ~* 'garbage disposal|disposal' then 12
      when brand ~* 'refrigerator|fridge' then 11
      when brand ~* 'dishwasher' then 9
      when brand ~* 'washing machine|washer' then 10
      when brand ~* 'dryer' then 13
      when brand ~* 'microwave' then 9
      when brand ~* 'oven|range' then 14
      when brand ~* 'freezer' then 15
      when brand ~* 'water softener|softener' then 20
      when brand is not null then 10
      else null
    end
  when category = 'hvac_indoor' then 20
  when category = 'hvac_outdoor' then 14
  when category = 'water_heater' then 9
  when category = 'roof' then 30
  when category = 'plumbing' then 50
  when category = 'toilet' then 100
  when category = 'faucet' then 18
  when category = 'sink' then 8
  when category = 'electrical' then 60
  when category = 'generator' then 12
  when category = 'solar' then 25
  when category = 'ev_charger' then 10
  when category = 'windows' then 14
  when category = 'exterior' then 9
  when category = 'balcony' then 20
  when category = 'deck' then 20
  when category = 'garden' then 20
  else expected_life_years
end
where expected_life_years is null;
