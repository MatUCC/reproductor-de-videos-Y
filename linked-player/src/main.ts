import { MusicPlayer } from "./player/MusicPlayer";
import { YouTubeService } from "./services/YouTubeService";
import { YouTubePlayerAdapter } from "./services/YouTubePlayerAdapter";
import { PlayerView } from "./ui/PlayerView";

const engine = new YouTubePlayerAdapter("yt-player");
const player = new MusicPlayer(engine);

engine.onEnded = () => player.nextTrack();                 // video ended -> follow current.next
engine.onPlayingChange = (playing) => player.syncPlaying(playing);

new PlayerView(player, new YouTubeService());
