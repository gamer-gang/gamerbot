import { Message } from 'discord.js';
import _ from 'lodash';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import { client } from '../../../../providers';
import { Context, YoutubeTrack } from '../../../../types';
import { codeBlock, Embed, getPlaylistVideos, regExps } from '../../../../util';
import { CommandPlay } from '../play';

export const getYoutubePlaylist = async (
  context: Context,
  caller: CommandPlay
): Promise<void | Message> => {
  const { msg, args } = context;

  try {
    const id = regExps.youtube.playlist.exec(args._[0])![1];

    // eslint-disable-next-line prefer-const
    let [playlist, videos] = await getPlaylistVideos(id);

    switch (args.sort) {
      case 'newest':
        videos.sort(
          (a, b) =>
            DateTime.fromISO(a.snippet?.publishedAt as string).toMillis() -
            DateTime.fromISO(b.snippet?.publishedAt as string).toMillis()
        );
        break;
      case 'oldest':
        videos.sort(
          (a, b) =>
            DateTime.fromISO(b.snippet?.publishedAt as string).toMillis() -
            DateTime.fromISO(a.snippet?.publishedAt as string).toMillis()
        );
        break;
      case 'views':
        videos.sort(
          (a, b) =>
            parseInt(b.statistics?.viewCount ?? '0') - parseInt(a.statistics?.viewCount ?? '0')
        );
        break;
      case 'random':
        videos = _.shuffle(videos);
        break;
    }

    videos.forEach(v => {
      caller.queueTrack(new YoutubeTrack(msg.author.id, v), {
        context,
        silent: true,
        beginPlaying: false,
      });
    });

    msg.channel.send(
      Embed.success(
        `Queued ${videos.length.toString()} videos from ` +
          `**[${playlist.snippet?.title}](https://youtube.com/playlist?list=${playlist.id})**`
      )
    );

    const queue = client.queues.get(msg.guild.id);
    if (!queue.playing) caller.playNext(context);
  } catch (err) {
    getLogger(`MESSAGE ${msg.id}`).error(err);
    if (err.toString() === 'Error: resource youtube#playlistListResponse not found')
      return msg.channel.send(
        Embed.error("Playlist not found (either it doesn't exist or it's private)")
      );

    return msg.channel.send(Embed.error(codeBlock(err)));
  }
};
