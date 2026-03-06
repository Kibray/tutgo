/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Код подтверждения TUTGO</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>TUTGO</Text>
        <Heading style={h1}>Код подтверждения</Heading>
        <Text style={text}>Используйте код ниже для подтверждения действия:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Код действителен ограниченное время. Если вы не запрашивали его,
          просто проигнорируйте это письмо.
        </Text>
        <Text style={brand}>TUTGO · Сделано в Узбекистане 🇺🇿</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(142, 72%, 29%)',
  margin: '0 0 24px',
  letterSpacing: '-0.5px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 15%, 10%)',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 10%, 40%)',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const codeStyle = {
  fontFamily: "'Space Grotesk', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(142, 72%, 29%)',
  margin: '0 0 32px',
  letterSpacing: '4px',
}
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '32px 0 0' }
const brand = { fontSize: '12px', color: 'hsl(220, 10%, 65%)', margin: '16px 0 0' }
