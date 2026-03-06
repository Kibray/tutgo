/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="ru" dir="ltr">
    <Head />
    <Preview>Ваша ссылка для входа в TUTGO</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>TUTGO</Text>
        <Heading style={h1}>Вход в аккаунт</Heading>
        <Text style={text}>
          Нажмите кнопку ниже, чтобы войти в TUTGO. Ссылка действительна
          ограниченное время.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Войти
        </Button>
        <Text style={footer}>
          Если вы не запрашивали эту ссылку, просто проигнорируйте это письмо.
        </Text>
        <Text style={brand}>TUTGO · Сделано в Узбекистане 🇺🇿</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const button = {
  backgroundColor: 'hsl(142, 72%, 29%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '24px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 55%)', margin: '32px 0 0' }
const brand = { fontSize: '12px', color: 'hsl(220, 10%, 65%)', margin: '16px 0 0' }
