import React, { useRef } from 'react';
import { useState, useLayoutEffect } from 'react';
import Client from './Client';
import logo from '../assets/logo192.png';
import { SnapControl, Snapcast } from '../snapcontrol';
import {
  Alert, Box, Button, Card, Checkbox, Divider, FormControl,
  FormControlLabel, FormGroup, MenuItem, Select, Slider, Snackbar,
  Stack, TextField, Typography, IconButton, alpha,
} from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';


type GroupClient = {
  client: Snapcast.Client;
  inGroup: boolean;
  wasInGroup: boolean;
};

type GroupProps = {
  server: Snapcast.Server;
  group: Snapcast.Group;
  snapcontrol: SnapControl;
  showOffline: boolean;
};

type GroupVolumeChange = {
  volumeEntered: boolean;
  client_volumes: Map<string, number>;
  group_volume: number;
};

export default function Group(props: GroupProps) {
  const [update, setUpdate] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clients, setClients] = useState<GroupClient[]>([]);
  const [streamId, setStreamId] = useState("");
  const [deletedClients, setDeletedClients] = useState<Snapcast.Client[]>([]);
  const [volume, setVolume] = useState(0);
  const groupVolumeChange = useRef<GroupVolumeChange>({
    volumeEntered: true,
    client_volumes: new Map<string, number>(),
    group_volume: 0,
  });

  function updateVolume() {
    const clients = getClients();
    let vol = 0;
    for (const client of clients)
      vol += client.config.volume.percent;
    vol /= clients.length;
    setVolume(vol);
  }

  useLayoutEffect(() => {
    updateVolume();
  });

  function handleSettingsClicked(_event: React.MouseEvent<HTMLButtonElement>) {
    const allGroupClients: GroupClient[] = [];
    for (const group of props.server.groups) {
      for (const client of group.clients) {
        const inGroup: boolean = props.group.clients.includes(client);
        allGroupClients.push({ client, inGroup, wasInGroup: inGroup });
      }
    }
    setSettingsOpen(true);
    setClients(allGroupClients);
    setStreamId(props.group.stream_id);
  }

  function handleSettingsClose(apply: boolean) {
    if (apply) {
      let changed = false;
      for (const element of clients) {
        if (element.inGroup !== element.wasInGroup) {
          changed = true;
          break;
        }
      }
      if (changed) {
        const groupClients: string[] = [];
        for (const element of clients)
          if (element.inGroup)
            groupClients.push(element.client.id);
        props.snapcontrol.setClients(props.group.id, groupClients);
      }
      if (props.group.stream_id !== streamId)
        props.snapcontrol.setStream(props.group.id, streamId);
    }
    setSettingsOpen(false);
  }

  function handleGroupClientChange(client: Snapcast.Client, inGroup: boolean) {
    const newclients = clients;
    const idx = newclients.findIndex(element => element.client === client);
    newclients[idx].inGroup = inGroup;
    setClients(newclients);
    setUpdate(update + 1);
  }

  function handleClientDelete(client: Snapcast.Client) {
    const newDeletedClients = deletedClients;
    if (!newDeletedClients.includes(client))
      newDeletedClients.push(client);
    setDeletedClients(newDeletedClients);
    setUpdate(update + 1);
  }

  function handleClientVolumeChange(_client: Snapcast.Client) {
    updateVolume();
  }

  function handleSnackbarClose(client: Snapcast.Client, undo: boolean) {
    if (!undo)
      props.snapcontrol.deleteClient(client.id);
    const newDeletedClients = deletedClients;
    if (newDeletedClients.includes(client))
      newDeletedClients.splice(newDeletedClients.indexOf(client), 1);
    setDeletedClients(newDeletedClients);
    setUpdate(update + 1);
  }

  function handleMuteClicked() {
    props.group.muted = !props.group.muted;
    props.snapcontrol.muteGroup(props.group.id, props.group.muted);
    setUpdate(update + 1);
  }

  function handleVolumeChange(value: number) {
    if (groupVolumeChange.current.volumeEntered) {
      groupVolumeChange.current.client_volumes.clear();
      groupVolumeChange.current.group_volume = 0;
      for (const client of getClients()) {
        groupVolumeChange.current.client_volumes.set(client.id, client.config.volume.percent);
        groupVolumeChange.current.group_volume += client.config.volume.percent;
      }
      groupVolumeChange.current.group_volume /= groupVolumeChange.current.client_volumes.size;
      groupVolumeChange.current.volumeEntered = false;
    }

    const delta = value - groupVolumeChange.current.group_volume;
    let ratio: number;
    if (delta < 0)
      ratio = (groupVolumeChange.current.group_volume - value) / groupVolumeChange.current.group_volume;
    else
      ratio = (value - groupVolumeChange.current.group_volume) / (100 - groupVolumeChange.current.group_volume);

    for (const client of getClients()) {
      let new_volume = groupVolumeChange.current.client_volumes.get(client.id)!;
      if (delta < 0)
        new_volume -= ratio * new_volume;
      else
        new_volume += ratio * (100 - new_volume);
      client.config.volume.percent = new_volume;
      props.snapcontrol.setVolume(client.id, new_volume);
    }
    setVolume(value);
  }

  function handleVolumeChangeCommitted(_value: number) {
    groupVolumeChange.current.volumeEntered = true;
  }

  function handlePlayPauseClicked() {
    if (props.server.getStream(props.group.stream_id)?.properties.playbackStatus === "playing")
      props.snapcontrol.control(props.group.stream_id, 'pause');
    else
      props.snapcontrol.control(props.group.stream_id, 'play');
  }

  function snackbar() {
    return deletedClients.map(client =>
      <Snackbar
        open
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={6000}
        key={'snackbar-' + client.id}
        onClose={(_, reason: string) => { if (reason !== 'clickaway') handleSnackbarClose(client, false); }}
      >
        <Alert
          onClose={() => handleSnackbarClose(client, false)}
          severity="info"
          sx={{ width: '100%', borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => handleSnackbarClose(client, true)}>
              Undo
            </Button>
          }
        >
          Deleted {client.getName()}
        </Alert>
      </Snackbar>
    );
  }

  function getClients(): Snapcast.Client[] {
    const result = [];
    for (const client of props.group.clients) {
      if ((client.connected || props.showOffline) && !deletedClients.includes(client)) {
        result.push(client);
      }
    }
    return result;
  }

  const groupClients = [];
  for (const client of getClients()) {
    groupClients.push(
      <Client
        key={client.id}
        client={client}
        snapcontrol={props.snapcontrol}
        onDelete={() => handleClientDelete(client)}
        onVolumeChange={() => handleClientVolumeChange(client)}
      />
    );
  }

  if (groupClients.length === 0)
    return <div>{snackbar()}</div>;

  const stream = props.server.getStream(props.group.stream_id);
  const artUrl = stream?.properties.metadata?.artUrl || logo;
  const title = stream?.properties.metadata?.title || null;
  const artist: string | null = stream?.properties.metadata?.artist
    ? stream!.properties.metadata.artist.join(', ')
    : null;
  const isPlaying = stream?.properties.playbackStatus === "playing";
  const hasMetadata = !!(stream?.properties.metadata);
  const canControl = !!stream?.properties.canControl;

  return (
    <Box>
      <Card>
        {/* Card header: stream selector + group settings */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            pt: 1,
            pb: 0.5,
          }}
        >
          <FormControl variant="standard" sx={{ minWidth: 120, flex: 1 }}>
            <Select
              value={props.group.stream_id}
              inputProps={{ 'aria-label': 'Active stream' }}
              disableUnderline
              onChange={(event) => {
                const stream: string = event.target.value;
                setStreamId(stream);
                props.snapcontrol.setStream(props.group.id, stream);
              }}
              sx={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'text.secondary',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                '& .MuiSelect-select': { py: 0.5, pr: '24px !important' },
              }}
            >
              {props.server.streams.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.id}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton
            aria-label="Group settings"
            size="small"
            onClick={handleSettingsClicked}
            sx={{ color: 'text.secondary', ml: 1 }}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Now playing section */}
        {hasMetadata && (
          <Box sx={{ px: 2, pt: 0.5, pb: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src={artUrl}
                alt={title ? `${title} cover` : 'Album art'}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  objectFit: 'cover',
                  flexShrink: 0,
                  bgcolor: 'action.hover',
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <Typography
                    noWrap
                    variant="subtitle1"
                    sx={{ fontWeight: 600, lineHeight: 1.3 }}
                  >
                    {title}
                  </Typography>
                )}
                {artist && (
                  <Typography
                    noWrap
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.4, mt: 0.25 }}
                  >
                    {artist}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {/* Playback controls */}
        {canControl && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              pb: hasMetadata ? 1 : 0.5,
              pt: hasMetadata ? 0 : 0.5,
            }}
          >
            <IconButton
              aria-label="Previous"
              onClick={() => props.snapcontrol.control(props.group.stream_id, 'previous')}
              sx={{ color: 'text.secondary' }}
            >
              <SkipPreviousIcon sx={{ fontSize: 30 }} />
            </IconButton>

            <IconButton
              aria-label="Play/Pause"
              onClick={handlePlayPauseClicked}
              sx={{
                width: 52,
                height: 52,
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:active': { opacity: 0.7 },
              }}
            >
              {isPlaying
                ? <PauseIcon sx={{ fontSize: 26 }} />
                : <PlayArrowIcon sx={{ fontSize: 26 }} />
              }
            </IconButton>

            <IconButton
              aria-label="Next"
              onClick={() => props.snapcontrol.control(props.group.stream_id, 'next')}
              sx={{ color: 'text.secondary' }}
            >
              <SkipNextIcon sx={{ fontSize: 30 }} />
            </IconButton>
          </Box>
        )}

        {/* Group volume (only shown when there are multiple clients) */}
        {groupClients.length > 1 && (
          <Box sx={{ px: 2, pb: 0.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                aria-label={props.group.muted ? "Unmute group" : "Mute group"}
                size="small"
                onClick={handleMuteClicked}
                sx={{
                  color: props.group.muted ? 'text.disabled' : 'primary.main',
                  bgcolor: props.group.muted
                    ? 'transparent'
                    : alpha('#0A84FF', 0.08),
                  borderRadius: 1.5,
                  p: 0.75,
                }}
              >
                {props.group.muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </IconButton>
              <Slider
                aria-label="Group volume"
                min={0}
                max={100}
                size="small"
                key={"slider-" + props.group.id}
                value={volume}
                onChange={(_, value) => handleVolumeChange(value as number)}
                onChangeCommitted={(_, value) => handleVolumeChangeCommitted(value as number)}
                sx={{ color: props.group.muted ? 'text.disabled' : 'primary.main' }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
              >
                {Math.round(volume)}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Divider before client list */}
        <Divider sx={{ mx: 2 }} />

        {/* Client list */}
        <Box sx={{ px: 1, pt: 0.5, pb: 1 }}>
          {groupClients}
        </Box>
      </Card>

      {/* Group settings dialog */}
      <Dialog fullWidth open={settingsOpen} onClose={() => handleSettingsClose(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Group settings</DialogTitle>
        <DialogContent>
          <Divider textAlign="left" sx={{ mb: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
            Stream
          </Divider>
          <TextField
            margin="dense"
            id="stream"
            select
            fullWidth
            variant="standard"
            value={streamId}
            onChange={(event) => setStreamId(event.target.value)}
          >
            {props.server.streams.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.id}</MenuItem>
            ))}
          </TextField>
          <Divider textAlign="left" sx={{ mt: 2, mb: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
            Clients
          </Divider>
          <FormGroup>
            {clients.map(client => (
              <FormControlLabel
                key={"label-" + client.client.id}
                control={
                  <Checkbox
                    checked={client.inGroup}
                    key={"cb-" + client.client.id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleGroupClientChange(client.client, e.target.checked)
                    }
                  />
                }
                label={client.client.getName()}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => handleSettingsClose(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={() => handleSettingsClose(true)} variant="contained" sx={{ borderRadius: 2 }}>OK</Button>
        </DialogActions>
      </Dialog>

      {snackbar()}
    </Box>
  );
}
