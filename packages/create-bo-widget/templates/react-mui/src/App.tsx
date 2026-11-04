import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Toolbar,
  Typography,
} from '@mui/material';
import { useBoContext, useCurrentUser } from '@vulog/bo-widget-react';
import { useState } from 'react';

/** The content of the widget. It fills the element in a column: the main area scrolls. */
export default function App() {
  const { fleetId } = useBoContext();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Toolbar sx={{ flex: 'none', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Fleet {fleetId ?? '-'}</Typography>
      </Toolbar>
      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
        <Typography>Hello {user.fullName}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setOpen(true)}>
          About
        </Button>
      </Box>
      {/* Rendered in the shadow root, with the widget's styles, over the whole page. */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{'{{title}}'}</DialogTitle>
        <DialogContent>A widget of the Vulog back office, built with React and MUI.</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
