import { useState, useEffect, useRef } from 'react';
import Server from './Server';
import AboutDialog from './AboutDialog';
import SettingsDialog from './Settings';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme, config } from "../config";
import { SnapControl, Snapcast } from '../snapcontrol';
import { SnapStream } from '../snapstream';
import { AppBar, Box, Toolbar, Typography, IconButton, Snackbar, Alert, Button } from '@mui/material';
import { PlayArrow as PlayArrowIcon, Stop as StopIcon, Settings as SettingsIcon, Info as InfoIcon } from '@mui/icons-material';
import { createTheme, ThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import silence from '../assets/10-seconds-of-silence.mp3';
import snapcast512 from '../assets/snapcast-512.png';


const sharedComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        boxShadow: 'none',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        backgroundImage: 'none',
        boxShadow: 'none',
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        padding: '8px 0',
        height: 4,
      },
      track: {
        border: 'none',
        height: 4,
      },
      rail: {
        height: 4,
        opacity: 0.25,
      },
      thumb: {
        width: 20,
        height: 20,
        '&::before': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        },
        '&:hover, &.Mui-active': {
          boxShadow: '0 0 0 8px rgba(10, 132, 255, 0.16)',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:active': {
          opacity: 0.5,
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      spellCheck: false,
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
      },
    },
  },
} as const;

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF',
      light: '#64AAFF',
      dark: '#0055B3',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF375F',
      contrastText: '#fff',
    },
    background: {
      default: '#F2F2F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#6D6D72',
    },
    divider: 'rgba(60,60,67,0.12)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
  components: sharedComponents,
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0A84FF',
      light: '#5AC8FA',
      dark: '#0060CC',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF375F',
      contrastText: '#fff',
    },
    background: {
      default: '#000000',
      paper: '#1C1C1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
  components: sharedComponents,
});


export default function SnapWeb() {
  const [update, setUpdate] = useState(0);
  const [server, setServer] = useState(new Snapcast.Server());
  const [showOffline, setShowOffline] = useState(config.showOffline);
  const [theme, setTheme] = useState(config.theme);
  const [serverUrl, setServerUrl] = useState(config.baseUrl);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState("");
  const snapstreamRef = useRef<SnapStream | null>(null);
  const audioRef = useRef(new Audio());
  const snapControlRef = useRef(new SnapControl());

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', _event => {
    setTheme(config.theme);
  });

  useEffect(() => {
    console.debug("server updated");
  }, [server]);

  useEffect(() => {
    console.debug("serverUrl updated: " + serverUrl);
    setServer(new Snapcast.Server());
    snapControlRef.current.connect(serverUrl);
    const connection = snapControlRef.current;
    return () => {
      connection.disconnect();
    };
  }, [serverUrl]);

  function handleChange(snapserver: Snapcast.Server) {
    console.debug("Update: " + server.groups.length + " => " + snapserver.groups.length);
    setServer(snapserver);
    setUpdate(update + 1);
    updateMediaSession();
  }

  snapControlRef.current.onChange = (_control: SnapControl, server: Snapcast.Server) => handleChange(server);
  snapControlRef.current.onConnectionChanged = (_control: SnapControl, connected: boolean, error?: string) => {
    console.log("Connection state changed: " + connected + ", error: " + error);
    if (!connected) {
      setIsPlaying(false);
      setServer(new Snapcast.Server());
      if (error)
        setConnectError(error);
    }
    setConnected(connected);
  };

  function getMyStreamId(): string {
    try {
      const group = snapControlRef.current.getGroupFromClient(SnapStream.getClientId());
      return snapControlRef.current.getStream(group.stream_id).id;
    } catch (e) {
      return "";
    }
  }

  function updateMediaSession() {
    console.debug('updateMediaSession');
    if (!snapstreamRef.current)
      return;
    try {
      const streamId = getMyStreamId();
      const properties = snapControlRef.current.getStream(streamId).properties;
      const metadata = properties.metadata;
      const title: string = metadata?.title || "Unknown Title";
      const artist: string = (metadata?.artist !== undefined) ? metadata?.artist.join(', ') : "Unknown Artist";
      const album: string = metadata?.album || "";
      let artwork: Array<MediaImage> = [{ src: snapcast512, sizes: '512x512', type: 'image/png' }];
      if (metadata?.artUrl !== undefined) {
        artwork = [
          { src: metadata.artUrl, sizes: '96x96', type: 'image/png' },
          { src: metadata.artUrl, sizes: '128x128', type: 'image/png' },
          { src: metadata.artUrl, sizes: '192x192', type: 'image/png' },
          { src: metadata.artUrl, sizes: '256x256', type: 'image/png' },
          { src: metadata.artUrl, sizes: '384x384', type: 'image/png' },
          { src: metadata.artUrl, sizes: '512x512', type: 'image/png' },
        ];
      }
      console.info('Metadata title: ' + title + ', artist: ' + artist + ', album: ' + album);
      navigator.mediaSession!.metadata = new MediaMetadata({ title, artist, album, artwork });

      const mediaSession = navigator.mediaSession!;
      let play_state: MediaSessionPlaybackState = "none";
      if (properties.playbackStatus !== undefined) {
        if (properties.playbackStatus === "playing") {
          audioRef.current.play();
          play_state = "playing";
        } else if (properties.playbackStatus === "paused") {
          audioRef.current.pause();
          play_state = "paused";
        } else if (properties.playbackStatus === "stopped") {
          audioRef.current.pause();
          play_state = "none";
        }
      }

      mediaSession.playbackState = play_state;
      mediaSession.setActionHandler('play', properties.canPlay ? () => { snapControlRef.current.control(streamId, 'play'); } : null);
      mediaSession.setActionHandler('pause', properties.canPause ? () => { snapControlRef.current.control(streamId, 'pause'); } : null);
      mediaSession.setActionHandler('previoustrack', properties.canGoPrevious ? () => { snapControlRef.current.control(streamId, 'previous'); } : null);
      mediaSession.setActionHandler('nexttrack', properties.canGoNext ? () => { snapControlRef.current.control(streamId, 'next'); } : null);
      try {
        mediaSession.setActionHandler('stop', properties.canControl ? () => { snapControlRef.current.control(streamId, 'stop'); } : null);
      } catch (error) {
        console.debug('Warning! The "stop" media session action is not supported.');
      }
      const defaultSkipTime: number = 10;
      mediaSession.setActionHandler('seekbackward', properties.canSeek ?
        (event: MediaSessionActionDetails) => {
          const offset: number = (event.seekOffset || defaultSkipTime) * -1;
          if (properties.position !== undefined)
            Math.max(properties.position! + offset, 0);
          snapControlRef.current.control(streamId, 'seek', { 'offset': offset });
        } : null);

      mediaSession.setActionHandler('seekforward', properties.canSeek ? (event: MediaSessionActionDetails) => {
        const offset: number = event.seekOffset || defaultSkipTime;
        if ((metadata?.duration !== undefined) && (properties.position !== undefined))
          Math.min(properties.position! + offset, metadata.duration!);
        snapControlRef.current.control(streamId, 'seek', { 'offset': offset });
      } : null);

      try {
        mediaSession.setActionHandler('seekto', properties.canSeek ? (event: MediaSessionActionDetails) => {
          const position: number = event.seekTime || 0;
          if (metadata?.duration !== undefined)
            Math.min(position, metadata.duration!);
          snapControlRef.current.control(streamId, 'setPosition', { 'position': position });
        } : null);
      } catch (error) {
        console.debug('Warning! The "seekto" media session action is not supported.');
      }

      if ((metadata?.duration !== undefined) && (properties.position !== undefined) && (properties.position! <= metadata.duration!)) {
        if ('setPositionState' in mediaSession) {
          mediaSession.setPositionState!({ duration: metadata.duration, playbackRate: 1.0, position: properties.position! });
        }
      } else {
        mediaSession.setPositionState!({ duration: 0, playbackRate: 1.0, position: 0 });
      }
    } catch (e) {
      console.debug('updateMediaSession failed: ' + e);
    }
  }

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.src = silence;
      audioRef.current.loop = true;
      audioRef.current.play().then(() => {
        snapstreamRef.current = new SnapStream(config.baseUrl);
      });
    } else {
      if (snapstreamRef.current)
        snapstreamRef.current.stop();
      snapstreamRef.current = null;
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [isPlaying]);

  const isDark = theme === Theme.Dark || (theme === Theme.System && prefersDarkMode);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box
        className="SnapWeb"
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            bgcolor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(242,242,247,0.85)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: 1,
            borderColor: 'divider',
            color: isDark ? 'text.primary' : 'text.primary',
          }}
        >
          <Toolbar
            sx={{
              pt: 'env(safe-area-inset-top)',
              minHeight: { xs: 52 },
              px: { xs: 2 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: isConnected ? '#30D158' : '#FF453A',
                  flexShrink: 0,
                  transition: 'background-color 0.3s ease',
                }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                Snapweb
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isConnected && (
                <IconButton
                  size="medium"
                  aria-label={isPlaying ? "Stop browser playback" : "Play in browser"}
                  onClick={() => setIsPlaying(!isPlaying)}
                  sx={{
                    color: isPlaying ? 'primary.main' : 'text.secondary',
                    bgcolor: isPlaying ? alpha('#0A84FF', 0.12) : 'transparent',
                    borderRadius: 2,
                    '&:hover': { bgcolor: alpha('#0A84FF', 0.12) },
                  }}
                >
                  {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
              )}
              <IconButton
                size="medium"
                aria-label="Settings"
                onClick={() => setSettingsOpen(true)}
                sx={{ color: 'text.secondary', borderRadius: 2 }}
              >
                <SettingsIcon />
              </IconButton>
              <IconButton
                size="medium"
                aria-label="About"
                onClick={() => setAboutOpen(true)}
                sx={{ color: 'text.secondary', borderRadius: 2 }}
              >
                <InfoIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          className="scroll-area"
          sx={{
            flex: 1,
            overflowY: 'auto',
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <Server server={server} snapcontrol={snapControlRef.current} showOffline={showOffline} />
        </Box>

        {/* Connection error snackbar */}
        {!isConnected && (
          <Snackbar
            open
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            key='connect-error'
            sx={{ mb: 'env(safe-area-inset-bottom)' }}
          >
            <Alert
              severity="error"
              sx={{ width: '100%', borderRadius: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => setSettingsOpen(true)}>
                  Settings
                </Button>
              }
            >
              {connectError + "\nSnapserver: " + config.baseUrl}
            </Alert>
          </Snackbar>
        )}

        <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        <SettingsDialog open={settingsOpen} onClose={(apply: boolean) => {
          setSettingsOpen(false);
          if (apply) {
            setServerUrl(config.baseUrl);
            setTheme(config.theme);
            setShowOffline(config.showOffline);
          }
        }} />
      </Box>
    </ThemeProvider>
  );
}
