import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type GenericCardProps = {
    cardTitle: string;
}


export default function GenericCard(props: GenericCardProps) {
    const { cardTitle } = props
    return (
        <Card>
            <CardContent>
                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                    {cardTitle}
                </Typography>
                <Typography variant="h5" component="div">
                   test content
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small">Click Me</Button>
            </CardActions>
        </Card>
    );
}
