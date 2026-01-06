import { redirect } from 'next/navigation';

// [HELP:DISABLE_SCOREBOARD_ROUTE] START
export default function Page() {
  redirect('/konkurrencer/scoretavle');
}
// [HELP:DISABLE_SCOREBOARD_ROUTE] END
