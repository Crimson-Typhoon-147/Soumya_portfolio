
const HTB_API = 'https://labs.hackthebox.com/api/v4';

const jsonResponse = (data, status = 200) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300'
  },
  body: JSON.stringify(data)
});

async function htbRequest(path, token) {
  const response = await fetch(`${HTB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!response.ok) {
    throw new Error(`HTB API returned HTTP ${response.status}`);
  }

  return response.json();
}

function unwrap(value) {
  return value?.data ?? value?.profile ?? value;
}

function findNumber(objects, keys) {
  for (const object of objects) {
    if (!object || typeof object !== 'object') continue;

    for (const key of keys) {
      const value = object[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        Number.isFinite(Number(value))
      ) {
        return Number(value);
      }
    }
  }

  return null;
}

exports.handler = async () => {
  const token = process.env.HTB_APP_TOKEN;

  if (!token) {
    return jsonResponse({
      error: 'HTB_APP_TOKEN is not configured',
      ctfs: null,
      flags: null,
      htbGlobal: null,
      htbSeason: null
    }, 503);
  }

  try {
    // Identify the authenticated HTB account.
    const accountResponse = await htbRequest('/user/info', token);
    const account = unwrap(accountResponse);

    const userId =
      account?.info?.id ??
      account?.id ??
      account?.user?.id ??
      account?.profile?.id;

    if (!userId) {
      throw new Error(
        'Could not identify the HTB account from /user/info'
      );
    }

    // Retrieve the user's basic profile.
    const profileResponse = await htbRequest(
      `/user/profile/basic/${encodeURIComponent(userId)}`,
      token
    );

    const profile = unwrap(profileResponse);
    const sources = [profile, account];

    // Retrieve current HTB season rank.
    let seasonRank = null;

    try {
      const seasonsResponse = await htbRequest('/season/list', token);
      const seasonsData = unwrap(seasonsResponse);

      const seasons = Array.isArray(seasonsData)
        ? seasonsData
        : seasonsData?.seasons ?? [];

      const currentSeason = seasons.find(season =>
        season?.is_active === true ||
        season?.active === true ||
        season?.current === true
      );

      if (currentSeason?.id) {
        const rankResponse = await htbRequest(
          `/season/user/rank/${encodeURIComponent(currentSeason.id)}`,
          token
        );

        const rankData = unwrap(rankResponse);

        seasonRank = findNumber(
          [rankData, rankData?.user, rankData?.rank],
          ['rank', 'position', 'season_rank']
        );
      }
    } catch (error) {
      console.warn(
        'HTB season rank unavailable:',
        error.message
      );
    }

    // Retrieve global HTB rank.
    const globalRank = findNumber(sources, [
      'ranking',
      'global_rank',
      'global_position',
      'position'
    ]);

    // Retrieve HTB machine ownership statistics.
    const machineOwns = findNumber(sources, [
      'system_owns'
    ]);

    const userOwns = findNumber(sources, [
      'user_owns'
    ]);

    // Total captured machine flags:
    // user flags + root flags.
    const flags =
      machineOwns !== null && userOwns !== null
        ? machineOwns + userOwns
        : null;

    // Fully rooted HTB machines.
    const ctfs = machineOwns;

    return jsonResponse({
      ctfs,
      flags,
      projects: null,
      articles: null,
      htbGlobal: globalRank,
      htbSeason: seasonRank,
      source: 'HTB',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error(
      'Portfolio HTB stats error:',
      error.message
    );

    return jsonResponse({
      error: 'Unable to retrieve HTB statistics',
      ctfs: null,
      flags: null,
      htbGlobal: null,
      htbSeason: null
    }, 502);
  }
};
