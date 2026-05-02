import React from 'react';
import { useState } from 'react';
import { SnapControl, Snapcast } from '../snapcontrol';
import {
  Box, Button, InputAdornment, Menu, MenuItem,
  Slider, Stack, TextField, Typography, IconButton, alpha,
} from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';


type ClientProps = {
  client: Snapcast.Client;
  snapcontrol: SnapControl;
  onDelete: () => void;
  onVolumeChange: () => void;
};


export default function Client(props: ClientProps) {
  const [update, setUpdate] = useState(0);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(props.client.config.name);
  const [tmpLatency, setTmpLatency] = useState(props.client.config.latency);
  const [latency, setLatency] = useState(props.client.config.latency);

  function handleVolumeChange(value: number) {
    props.client.config.volume.percent = value;
    props.snapcontrol.setVolume(props.client.id, value, false);
    props.onVolumeChange();
  }

  function handleOptionsClicked(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
    setOpen(true);
    setName(props.client.config.name);
    setTmpLatency(props.client.config.latency);
    setLatency(props.client.config.latency);
  }

  function handleMenuClose() {
    setAnchorEl(null);
    setOpen(false);
  }

  function handleDetailsClose(apply: boolean) {
    setDetailsOpen(false);
    if (apply) {
      props.snapcontrol.setClientName(props.client.id, name);
      props.snapcontrol.setClientLatency(props.client.id, tmpLatency);
      setName(props.client.config.name);
      setLatency(tmpLatency);
    } else {
      props.snapcontrol.setClientLatency(props.client.id, latency);
      setName(props.client.config.name);
      setTmpLatency(latency);
    }
  }

  function handleDetailsClicked() {
    setDetailsOpen(true);
    setAnchorEl(null);
    setOpen(false);
  }

  function handleMuteClicked() {
    props.snapcontrol.setVolume(props.client.id, props.client.config.volume.percent, !props.client.config.volume.muted);
    setUpdate(update + 1);
  }

  const isMuted = props.client.config.volume.muted;
  const isConnected = props.client.connected;
  const displayName = props.client.config.name || props.client.host.name;

  const menuitems = [
    <MenuItem key='Menu-Details' onClick={handleDetailsClicked}>Details</MenuItem>,
  ];
  if (!isConnected)
    menuitems.push(
      <MenuItem key='Menu-Delete' onClick={() => { props.onDelete(); setAnchorEl(null); setOpen(false); }}>
        Delete
      </MenuItem>
    );

  return (
    <Box
      sx={{
        opacity: isConnected ? 1.0 : 0.45,
        py: 0.5,
        px: 0.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {/* Mute button */}
        <IconButton
          aria-label={isMuted ? "Unmute" : "Mute"}
          size="small"
          onClick={handleMuteClicked}
          sx={{
            color: isMuted ? 'text.disabled' : 'primary.main',
            bgcolor: isMuted ? 'transparent' : alpha('#0A84FF', 0.08),
            borderRadius: 1.5,
            p: 0.75,
            flexShrink: 0,
          }}
        >
          {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>

        {/* Name + slider */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 500,
              color: isConnected ? 'text.primary' : 'text.secondary',
              mb: 0.25,
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </Typography>
          <Slider
            aria-label={`Volume for ${displayName}`}
            min={0}
            max={100}
            size="small"
            key={"slider-" + props.client.id}
            value={props.client.config.volume.percent}
            onChange={(_, value) => handleVolumeChange(value as number)}
            sx={{ color: isMuted ? 'text.disabled' : 'primary.main', display: 'block' }}
          />
        </Box>

        {/* Volume percentage */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            minWidth: 30,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          {Math.round(props.client.config.volume.percent)}
        </Typography>

        {/* Options menu */}
        <IconButton
          aria-label="Options"
          size="small"
          onClick={handleOptionsClicked}
          sx={{ color: 'text.secondary', flexShrink: 0 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          slotProps={{ list: { 'aria-labelledby': 'client-options-button' } }}
          PaperProps={{ sx: { borderRadius: 2.5, minWidth: 140 } }}
        >
          {menuitems}
        </Menu>
      </Stack>

      {/* Client details dialog */}
      <Dialog open={detailsOpen} onClose={() => handleDetailsClose(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Client settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            variant="standard"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
            value={name}
          />
          <TextField
            margin="dense"
            id="latency"
            label="Latency"
            type="number"
            fullWidth
            value={tmpLatency}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setTmpLatency(Number(event.target.value) || 0)
            }
            variant="standard"
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">ms</InputAdornment>,
              },
            }}
          />
          <TextField
            margin="dense" id="client" label="Client" type="text" fullWidth variant="standard"
            value={props.client.snapclient.name + " " + props.client.snapclient.version}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            margin="dense" id="mac" label="MAC" type="text" fullWidth variant="standard"
            value={props.client.host.mac}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            margin="dense" id="id" label="ID" type="text" fullWidth variant="standard"
            value={props.client.id}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            margin="dense" id="ip" label="IP" type="text" fullWidth variant="standard"
            value={props.client.host.ip}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            margin="dense" id="host" label="Host" type="text" fullWidth variant="standard"
            value={props.client.host.name}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            margin="dense" id="os" label="OS" type="text" fullWidth variant="standard"
            value={props.client.host.os}
            slotProps={{ input: { readOnly: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => handleDetailsClose(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={() => handleDetailsClose(true)} variant="contained" sx={{ borderRadius: 2 }}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
