import Group from './Group';
import { SnapControl, Snapcast } from '../snapcontrol';
import { Stack } from '@mui/material';
import tokens from '../tokens';


type ServerProps = {
  server: Snapcast.Server;
  snapcontrol: SnapControl;
  showOffline: boolean;
};

export default function Server(props: ServerProps) {
  console.log("Render Server");
  return (
    <Stack
      spacing={tokens.cardGap}
      sx={{ p: tokens.pagePadding }}
    >
      {props.server.groups.map(group => (
        <Group
          group={group}
          key={group.id}
          server={props.server}
          snapcontrol={props.snapcontrol}
          showOffline={props.showOffline}
        />
      ))}
    </Stack>
  );
}
