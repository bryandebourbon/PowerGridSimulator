# Code from http://flask.pocoo.org/docs/0.12/tutorial/packaging/#tutorial-packaging

from setuptools import setup, find_packages

setup(
    name='pgsim',
    packages=find_packages(),#['pgsim'],
    include_package_data=True,
    install_requires=[
        'flask',
        'pypower',
    ],
)