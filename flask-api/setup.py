from setuptools import setup

setup(
    name='pcc',
    packages=['pcc'],
    include_package_data=True,
    install_requires=[
        'flask',
        'pypower',
    ],
)
