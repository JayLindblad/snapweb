import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, MenuItem, Select, SelectChangeEvent, InputLabel,
  FormControl, FormControlLabel, Checkbox, Box, Typography,
} from '@mui/material';
import { useState } from 'react';
import { config, Theme } from '../config.ts';

export default function SettingsDialog(props: { open: boolean; onClose: (_apply: boolean) => void }) {
  const [serverurl, setServerurl] = useState(config.baseUrl);
  const [theme, setTheme] = useState(config.theme);
  const [showOffline, setShowOffline] = useState(config.showOffline);

  function handleClose(apply: boolean) {
    if (apply) {
      config.baseUrl = serverurl;
      config.theme = theme;
      config.showOffline = showOffline;
    }
    props.onClose(apply);
  }

  return (
    <Dialog open={props.open} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Settings</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 500 }}>
            Snapserver host
          </Typography>
          <TextField
            id="host"
            type="text"
            fullWidth
            variant="outlined"
            size="small"
            placeholder="ws://192.168.1.x:1704"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setServerurl(event.target.value)}
            value={serverurl}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 500 }}>
            Theme
          </Typography>
          <FormControl variant="outlined" fullWidth size="small">
            <InputLabel id="theme-label">Theme</InputLabel>
            <Select
              labelId="theme-label"
              id="theme-select"
              value={theme}
              label="Theme"
              onChange={(event: SelectChangeEvent<Theme>) => setTheme(event.target.value as Theme)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value={Theme.System}>{Theme.System}</MenuItem>
              <MenuItem value={Theme.Light}>{Theme.Light}</MenuItem>
              <MenuItem value={Theme.Dark}>{Theme.Dark}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={showOffline}
              onChange={(_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => setShowOffline(checked)}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Show offline clients
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={() => handleClose(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button onClick={() => handleClose(true)} variant="contained" sx={{ borderRadius: 2 }}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
