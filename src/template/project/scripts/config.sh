#!/usr/bin/env bash

echo "Configurando projeto..."

echo -n

#######################################################
# GIT
#######################################################
read -p "Inicializar Git (Y/n)? " answer
case ${answer:0:1} in
y | Y | '')

  if [[ ! -x "$(command -v git)" ]]; then
    echo "Git não instalado"
  elif [ ]; then
    git init
  fi

  ;;
*)
  ;;
esac

#######################################################
# NPM INSTALL
#######################################################
read -p "Instalar dependencias?(Y/n)? " answer
case ${answer:0:1} in
y | Y | '')

  npm i --save @agtm/sindri-cli
  npm i --save @agtm/sindri-framework
  npm i --save config

  npm i --save-dev pkg
  npm i --save-dev nodemon

  ;;
*)
  ;;
esac

#######################################################
# CONFIGURAR ESLINT
#######################################################
read -p "Configurar Eslint (Y/n)? " answer
case ${answer:0:1} in
y | Y | '')

  npm i --save-dev eslint
  npx eslint --init

  ;;
*)

  ;;
esac

echo
echo "Configuração finalizada com sucesso!!"
echo