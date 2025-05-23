# SonarCloud Integration

Este projeto está configurado para realizar análises de qualidade de código usando o SonarCloud, a versão hospedada na nuvem do SonarQube. Abaixo estão as instruções para configurar e utilizar essa integração.

## Configuração de Segredos no GitHub

Para que a análise do SonarCloud funcione corretamente nos workflows do GitHub Actions, você precisa configurar os seguintes segredos no repositório:

1. **SONAR_TOKEN** - Token de acesso para autenticação no SonarCloud
2. **GITHUB_TOKEN** - Automaticamente fornecido pelo GitHub Actions

### Como configurar os segredos:

1. Acesse a página do seu repositório no GitHub
2. Vá para "Settings" > "Secrets and variables" > "Actions"
3. Clique em "New repository secret"
4. Adicione os seguintes segredos:
   - Nome: `SONAR_TOKEN`, Valor: [Seu token de acesso do SonarQube]
   - Nome: `SONAR_HOST_URL`, Valor: [URL do seu servidor SonarQube, ex: https://sonarqube.suaempresa.com]

## Quality Gates

Os Quality Gates são conjuntos de critérios que determinam se o código está pronto para ser integrado. No SonarCloud, a configuração do Quality Gate é feita diretamente na plataforma:

1. Acesse sua organização no SonarCloud
2. Vá para o projeto
3. No menu lateral, clique em "Quality Gates"
4. Selecione ou crie um Quality Gate conforme suas necessidades

O workflow configurado irá aguardar o resultado do Quality Gate antes de finalizar, garantindo que apenas código que atenda aos critérios de qualidade seja aprovado.

## Execução Local

Para executar a análise do SonarQube localmente antes de fazer o commit:

```bash
# Execute os testes com cobertura e relatório para SonarQube
yarn test:sonar

# Execute a análise do SonarQube (necessário ter o sonar-scanner instalado)
sonar-scanner
```

## Relatórios Gerados

- **Cobertura de código**: `coverage/lcov.info`
- **Execução de testes**: `test-report.xml`

Estes relatórios são automaticamente enviados para o SonarQube durante a análise.
