import {
  Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Typography, Box, Divider,
} from '@mui/material';

const version = import.meta.env.VITE_APP_VERSION + (import.meta.env.VITE_APP_GITREV ? " (rev " + import.meta.env.VITE_APP_GITREV.substring(0, 8) + ")" : "");

export default function AboutDialog(props: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={props.open} scroll="paper" fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>About Snapweb</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Snapweb {version}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Copyright &copy; 2020 – 2025{' '}
            <a href="mailto:snapweb@badaix.de">BadAix</a>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Author:{' '}
            <a href="https://www.linkedin.com/in/johannes-pohl">Johannes Pohl</a>{' '}
            and{' '}
            <a href="https://github.com/snapcast/snapweb/graphs/contributors">contributors</a>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          License
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Snapweb is licensed under the{' '}
          <a href="#gpl">GNU General Public License, version 3 or later</a>.
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          How Can I Help?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          If you find Snapcast and Snapweb useful, consider donating on{' '}
          <a href="https://www.paypal.me/badaix">PayPal</a>.
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          Sources
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <a href="https://github.com/snapcast/snapweb">https://github.com/snapcast/snapweb</a>
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          Libraries
        </Typography>
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.75rem',
            color: 'text.secondary',
            '& th': { textAlign: 'left', fontWeight: 600, pb: 0.5, borderBottom: 1, borderColor: 'divider' },
            '& td': { py: 0.5, pr: 1 },
          }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>License</th>
              <th>Author</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>@emotion/react</td><td>n/a</td><td>n/a</td></tr>
            <tr><td>@emotion/styled</td><td>MIT</td><td>n/a</td></tr>
            <tr><td>@mui/icons-material</td><td>n/a</td><td>n/a</td></tr>
            <tr><td>@mui/material</td><td>n/a</td><td>n/a</td></tr>
            <tr><td>libflacjs</td><td>MIT</td><td>n/a</td></tr>
            <tr><td>react</td><td>MIT</td><td>Facebook</td></tr>
            <tr><td>react-dom</td><td>MIT</td><td>Facebook</td></tr>
            <tr><td>standardized-audio-context</td><td>n/a</td><td>n/a</td></tr>
            <tr><td>typescript</td><td>Apache-2.0</td><td>Microsoft</td></tr>
          </tbody>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={props.onClose} variant="contained" sx={{ borderRadius: 2 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
