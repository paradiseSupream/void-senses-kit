import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  toolSlug?: string | null
}

const TOOL_NAMES: Record<string, string> = {
  'child-trauma': 'Child Trauma Test',
  iq: 'Quick IQ Test',
  'dark-personality': 'Dark Personality Test',
  'love-match': 'Love & Vibe Matcher',
  roast: 'AI Roast Me',
  'prompt-maker': 'AI Prompt Maker',
}

const Email = ({ toolSlug }: Props) => {
  const tool = toolSlug ? TOOL_NAMES[toolSlug] : undefined
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You&apos;re on the list — your Senses of Void results are saved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>SENSES OF VOID</Text>
          <Heading style={h1}>You&apos;re on the list</Heading>
          <Text style={text}>
            Thanks for signing up{tool ? ` after the ${tool}` : ''}. Your result is saved, and
            you&apos;ll be first to know when a new test goes live.
          </Text>
          <Section style={{ margin: '24px 0' }}>
            <Button href="https://sensesofvoid.app/tools" style={button}>
              Explore all tests
            </Button>
          </Section>
          <Text style={muted}>
            Want the full deep report with no ads and no export gates? A pass starts at $2.99, or
            go lifetime once and keep every future tool.
          </Text>
          <Hr style={hr} />
          <Text style={muted}>Senses of Void — sensesofvoid.app</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: "You're on the list — Senses of Void",
  displayName: 'Lead welcome',
  previewData: { toolSlug: 'dark-personality' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', Arial, sans-serif",
  color: '#0b1120',
}
const container = { padding: '28px 26px', maxWidth: '560px' }
const brand = {
  fontSize: '12px',
  letterSpacing: '2px',
  color: '#0b7a5a',
  fontWeight: 700,
  margin: '0 0 8px',
}
const h1 = { fontSize: '24px', margin: '0 0 12px', color: '#0b1120' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#20293a' }
const muted = { fontSize: '13px', lineHeight: '20px', color: '#5b6472' }
const button = {
  backgroundColor: '#0b7a5a',
  color: '#ffffff',
  borderRadius: '9999px',
  padding: '12px 22px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
}
const hr = { borderColor: '#e6e9ee', margin: '24px 0 12px' }
